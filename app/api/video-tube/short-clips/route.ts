import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { checkMemberAccess } from "@/lib/member-access";
import { communitySafetyStore, currentCommunityMember, sameOrigin } from "@/lib/community-safety";
export const runtime="nodejs";
export const dynamic="force-dynamic";
function store(){const tableId=process.env.APPWRITE_VIDEO_TUBE_TABLE_ID?.trim();if(!tableId)throw new Error("APPWRITE_VIDEO_TUBE_TABLE_ID is not configured.");const {tablesDB,databaseId}=communitySafetyStore();return {tablesDB,databaseId,tableId};}
export async function GET(){
 const user=await currentCommunityMember();if(!user)return NextResponse.json({error:"Sign in to view Connect Short Clips."},{status:401});
 const access=await checkMemberAccess();if(!access.allowed)return NextResponse.json({error:"Verified adult member access is required."},{status:access.status});
 try{const s=store();const [published,ownDrafts]=await Promise.all([
  s.tablesDB.listRows({databaseId:s.databaseId,tableId:s.tableId,queries:[Query.equal("record_type","clip"),Query.equal("status","approved"),Query.orderDesc("created_at"),Query.limit(100)]}),
  s.tablesDB.listRows({databaseId:s.databaseId,tableId:s.tableId,queries:[Query.equal("record_type","clip"),Query.equal("user_id",user.$id),Query.equal("status","draft"),Query.orderDesc("created_at"),Query.limit(50)]})
 ]);
 return NextResponse.json({clips:published.rows.map(row=>({$id:row.$id,title:row.title,caption:row.caption,category:row.category,creator_name:row.creator_name,media_url:row.media_url,thumbnail_url:row.thumbnail_url,view_count:row.view_count})),drafts:ownDrafts.rows.map(row=>({$id:row.$id,title:row.title,category:row.category,status:row.status}))},{headers:{"Cache-Control":"no-store"}});
 }catch(error){console.error("Short Clips lookup failed",error instanceof Error?error.message:"unknown");return NextResponse.json({error:"Short Clips storage is not configured or is unavailable."},{status:503});}
}
export async function POST(request:Request){
 if(!sameOrigin(request))return NextResponse.json({error:"Request origin could not be verified."},{status:403});
 const user=await currentCommunityMember();if(!user)return NextResponse.json({error:"Sign in before creating a clip draft."},{status:401});
 const access=await checkMemberAccess();if(!access.allowed)return NextResponse.json({error:"Verified adult member access is required."},{status:access.status});
 let body:Record<string,unknown>;try{body=await request.json() as Record<string,unknown>;}catch{return NextResponse.json({error:"Invalid clip draft."},{status:400});}
 const title=typeof body.title==="string"?body.title.trim().slice(0,90):"",caption=typeof body.caption==="string"?body.caption.trim().slice(0,500):"",category=typeof body.category==="string"?body.category.trim():"";
 const allowed=["Learning","Music","Travel","Technology","Nature","Creative","Sports","Gaming","Comedy","Food","Lifestyle"];
 if(!title||!allowed.includes(category))return NextResponse.json({error:"Add a title and choose a valid topic."},{status:400});
 try{const s=store(),now=new Date().toISOString();const row=await s.tablesDB.createRow({databaseId:s.databaseId,tableId:s.tableId,rowId:ID.unique(),data:{record_type:"clip",user_id:user.$id,title,caption,category,creator_name:typeof user.name==="string"?user.name.slice(0,80):"Connect creator",status:"draft",media_url:"",thumbnail_url:"",view_count:0,created_at:now,updated_at:now}});
 return NextResponse.json({saved:true,draft:{$id:row.$id,title:row.title,category:row.category,status:row.status}},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(error){console.error("Short Clips draft save failed",error instanceof Error?error.message:"unknown");return NextResponse.json({error:"Clip draft could not be saved. Check the private Appwrite Video Tube table."},{status:503});}
}
