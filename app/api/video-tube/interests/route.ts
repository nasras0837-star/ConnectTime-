import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { checkMemberAccess } from "@/lib/member-access";
import { communitySafetyStore, currentCommunityMember, sameOrigin } from "@/lib/community-safety";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const topicKeywords:Record<string,string[]>={Learning:["learn","lesson","how to","tutorial","education","science","history","study"],Music:["music","song","sing","guitar","piano","concert","artist"],Travel:["travel","trip","vacation","destination","hotel","country","city"],Technology:["tech","technology","ai","software","phone","computer","coding","gadget"],Nature:["nature","wildlife","animal","ocean","forest","garden","planet"],Creative:["art","design","photo","photography","drawing","craft","creative"],Sports:["sport","football","basketball","soccer","tennis","baseball","wrestling","fitness"],Gaming:["game","gaming","playstation","xbox","nintendo","esports","streamer"],Comedy:["comedy","funny","humor","joke","prank","skit"],Food:["food","recipe","cooking","restaurant","baking","chef"],Lifestyle:["lifestyle","fashion","beauty","wellness","home","routine"]};
function store(){const tableId=process.env.APPWRITE_VIDEO_TUBE_TABLE_ID?.trim();if(!tableId)throw new Error("APPWRITE_VIDEO_TUBE_TABLE_ID is not configured.");const {tablesDB,databaseId}=communitySafetyStore();return {tablesDB,databaseId,tableId};}
function inferTopic(q:string){const text=q.toLowerCase();return Object.entries(topicKeywords).map(([topic,words])=>({topic,score:words.reduce((n,w)=>n+(text.includes(w)?(w.includes(" ")?2:1):0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score)[0]?.topic||"General";}
export async function GET(){
 const user=await currentCommunityMember();if(!user)return NextResponse.json({error:"Sign in to sync your video interests."},{status:401});
 const access=await checkMemberAccess({requireAdultVerification:false});if(!access.allowed)return NextResponse.json({error:"An active member account is required to personalize video discovery."},{status:access.status});
 try{const s=store(),result=await s.tablesDB.listRows({databaseId:s.databaseId,tableId:s.tableId,queries:[Query.equal("record_type","search"),Query.equal("user_id",user.$id),Query.orderDesc("created_at"),Query.limit(80)]});
 const searches=result.rows.map(row=>String(row.query_text||"")).filter(Boolean),scores:Record<string,number>={};
 result.rows.forEach((row,index)=>{const topic=String(row.category||"General");if(topic!=="General")scores[topic]=(scores[topic]||0)+Math.max(1,10-Math.floor(index/8));});
 const interests=Object.entries(scores).sort((a,b)=>b[1]-a[1]).map(([topic])=>topic);
 return NextResponse.json({searches:[...new Set(searches)].slice(0,12),interests},{headers:{"Cache-Control":"no-store"}});
 }catch(error){console.error("Video interest lookup failed",error instanceof Error?error.message:"unknown");return NextResponse.json({error:"Video interest storage is not configured or is unavailable."},{status:503});}
}
export async function POST(request:Request){
 if(!sameOrigin(request))return NextResponse.json({error:"Request origin could not be verified."},{status:403});
 const user=await currentCommunityMember();if(!user)return NextResponse.json({error:"Sign in before syncing search interests."},{status:401});
 const access=await checkMemberAccess({requireAdultVerification:false});if(!access.allowed)return NextResponse.json({error:"An active member account is required to personalize video discovery."},{status:access.status});
 let body:Record<string,unknown>;try{body=await request.json() as Record<string,unknown>;}catch{return NextResponse.json({error:"Invalid search activity."},{status:400});}
 const query=typeof body.query==="string"?body.query.trim().replace(/\s+/g," ").slice(0,120):"";
 if(query.length<2)return NextResponse.json({error:"Search must contain at least two characters."},{status:400});
 try{const s=store(),row=await s.tablesDB.createRow({databaseId:s.databaseId,tableId:s.tableId,rowId:ID.unique(),data:{record_type:"search",user_id:user.$id,query_text:query,category:inferTopic(query),event_type:"search",created_at:new Date().toISOString()}});
 return NextResponse.json({saved:true,topic:row.category},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(error){console.error("Video interest save failed",error instanceof Error?error.message:"unknown");return NextResponse.json({error:"Search interests could not be saved. Check the private Appwrite Video Tube table."},{status:503});}
}
