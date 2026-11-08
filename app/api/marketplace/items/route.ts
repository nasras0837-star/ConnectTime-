import { NextResponse } from "next/server";
import { ID, Query, Client, Databases } from "node-appwrite";
import { checkMemberAccess } from "@/lib/member-access";
import { communitySafetyStore, currentCommunityMember, sameOrigin } from "@/lib/community-safety";
import { isEligible } from "@/lib/access-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const categories = ["Real estate","Vehicles","Electronics","Furniture","Clothing & accessories","Comic books","Sports cards","Collectibles","Home & garden","Tools & equipment","Books & media","Toys & games","Other products"];
const conditions = ["New","Like new","Good","Fair","For parts / renovation","Not applicable (real estate)"];
const prohibited = /\b(prostitution|escort services?|sexual services?|sex services?|paid sexual activity|sexual solicitation|adult entertainment services|happy endings?)\b/i;

function services() {
  const tableId = process.env.APPWRITE_MARKETPLACE_ITEMS_TABLE_ID;
  const profilesTableId = process.env.APPWRITE_PROFILES_TABLE_ID;
  const blocksTableId = process.env.APPWRITE_COMMUNITY_BLOCKS_TABLE_ID;
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const accessDatabaseId = process.env.APPWRITE_ACCESS_DATABASE_ID;
  const accessCollectionId = process.env.APPWRITE_MEMBER_ACCESS_COLLECTION_ID;
  if (!tableId || !profilesTableId || !blocksTableId || !endpoint || !projectId || !apiKey || !accessDatabaseId || !accessCollectionId) throw new Error("Marketplace storage is not configured.");
  const { tablesDB, databaseId } = communitySafetyStore();
  const databases = new Databases(new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey));
  return { tablesDB, databaseId, tableId, profilesTableId, blocksTableId, databases, accessDatabaseId, accessCollectionId };
}
async function eligible(s: ReturnType<typeof services>, userId: string) {
  try { const row = await s.databases.getDocument(s.accessDatabaseId,s.accessCollectionId,userId); return isEligible({adult_status:row.adult_status,account_status:row.account_status}); }
  catch { return false; }
}
async function blocked(s: ReturnType<typeof services>, a: string, b: string) {
  const tableId=s.blocksTableId;
  const [ab,ba]=await Promise.all([
    s.tablesDB.listRows({databaseId:s.databaseId,tableId,queries:[Query.equal("blocker_user_id",a),Query.equal("blocked_user_id",b),Query.limit(1)]}),
    s.tablesDB.listRows({databaseId:s.databaseId,tableId,queries:[Query.equal("blocker_user_id",b),Query.equal("blocked_user_id",a),Query.limit(1)]})
  ]);
  return ab.rows.length>0||ba.rows.length>0;
}
export async function GET(){
 const user=await currentCommunityMember();
 if(!user)return NextResponse.json({error:"Sign in to browse the marketplace."},{status:401});
 const access=await checkMemberAccess();
 if(!access.allowed)return NextResponse.json({error:"Verified adult membership is required."},{status:access.status});
 try{
  const s=services();
  const result=await s.tablesDB.listRows({databaseId:s.databaseId,tableId:s.tableId,queries:[Query.equal("status","active"),Query.orderDesc("created_at"),Query.limit(100)]});
  const items=[];
  for(const row of result.rows){
   const sellerId=String(row.seller_user_id||"");
   if(!sellerId||!await eligible(s,sellerId)||await blocked(s,user.$id,sellerId))continue;
   const profileRows=await s.tablesDB.listRows({databaseId:s.databaseId,tableId:s.profilesTableId,queries:[Query.equal("user_id",sellerId),Query.limit(1)]});
   const profile=profileRows.rows[0];
   if(!profile||!["public","members"].includes(String(profile.visibility||"")))continue;
   items.push({id:String(row.$id),category:String(row.category||""),title:String(row.title||""),description:String(row.description||""),price:Number(row.price||0),condition:String(row.condition_label||""),location:String(row.location||""),createdAt:String(row.created_at||""),seller:{handle:String(profile.handle||""),displayName:String(profile.display_name||profile.handle||"")},mine:sellerId===user.$id});
  }
  return NextResponse.json({items},{headers:{"Cache-Control":"no-store"}});
 }catch(error){console.error("Marketplace lookup failed",error instanceof Error?error.message:"unknown");return NextResponse.json({error:"Marketplace storage is not configured or is temporarily unavailable."},{status:503});}
}
export async function POST(request:Request){
 if(!sameOrigin(request))return NextResponse.json({error:"Request origin could not be verified."},{status:403});
 const user=await currentCommunityMember();
 if(!user)return NextResponse.json({error:"Sign in before posting a listing."},{status:401});
 const access=await checkMemberAccess();
 if(!access.allowed)return NextResponse.json({error:"Verified adult membership is required."},{status:access.status});
 let body:Record<string,unknown>;
 try{body=await request.json() as Record<string,unknown>}catch{return NextResponse.json({error:"Invalid listing."},{status:400})}
 const category=typeof body.category==="string"?body.category.trim():"";
 const title=typeof body.title==="string"?body.title.trim():"";
 const description=typeof body.description==="string"?body.description.trim():"";
 const condition=typeof body.condition==="string"?body.condition.trim():"";
 const location=typeof body.location==="string"?body.location.trim():"";
 const price=Number(body.price);
 if(!categories.includes(category)||title.length<3||title.length>100||description.length<15||description.length>1800||!conditions.includes(condition)||location.length<2||location.length>100||!Number.isFinite(price)||price<=0||price>100000000)return NextResponse.json({error:"Check the category, title, description, price, condition and location."},{status:400});
 if(prohibited.test([category,title,description].join(" ")))return NextResponse.json({error:"This listing appears to advertise prohibited sexual or escort services. Connect Marketplace is only for lawful goods and property; prostitution, escort services and paid sexual services are not allowed."},{status:400});
 if(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(title+description+location))return NextResponse.json({error:"The listing contains unsupported control characters."},{status:400});
 try{
  const s=services();
  const recent=await s.tablesDB.listRows({databaseId:s.databaseId,tableId:s.tableId,queries:[Query.equal("seller_user_id",user.$id),Query.greaterThanEqual("created_at",new Date(Date.now()-60*60_000).toISOString()),Query.limit(11)]});
  if(recent.rows.length>=10)return NextResponse.json({error:"You have reached the listing limit. Please wait before posting more items."},{status:429});
  const profileRows=await s.tablesDB.listRows({databaseId:s.databaseId,tableId:s.profilesTableId,queries:[Query.equal("user_id",user.$id),Query.limit(1)]});
  const profile=profileRows.rows[0];
  if(!profile||!["public","members"].includes(String(profile.visibility||"")))return NextResponse.json({error:"Set your profile visibility to Public or Signed-in members before selling."},{status:403});
  const now=new Date().toISOString();
  const row=await s.tablesDB.createRow({databaseId:s.databaseId,tableId:s.tableId,rowId:ID.unique(),data:{seller_user_id:user.$id,category,title,description,price,currency:"USD",condition_label:condition,location,status:"active",created_at:now,updated_at:now}});
  return NextResponse.json({created:true,item:{id:String(row.$id),category,title,description,price,condition,location,createdAt:now,seller:{handle:String(profile.handle||""),displayName:String(profile.display_name||profile.handle||"")},mine:true}},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(error){console.error("Marketplace listing creation failed",error instanceof Error?error.message:"unknown");return NextResponse.json({error:"The listing could not be saved. Check the Marketplace Appwrite table setup."},{status:503});}
}
