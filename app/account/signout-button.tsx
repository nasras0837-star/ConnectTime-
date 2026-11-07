"use client";
import { useAuth } from "@appwrite.io/react"; import { useRouter } from "next/navigation";
export function SignOutButton(){const router=useRouter();const {signOut}=useAuth();return <button className="button" disabled={signOut.isPending} onClick={()=>signOut.signOut({onSuccess:()=>{router.push("/");router.refresh();}})}>{signOut.isPending?"Signing out…":"Sign out"}</button>;}
