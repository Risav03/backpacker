'use client'
import { getReviewsByPlace } from "@/lib/hooks/reviewsByPlace.hook";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { usePathname } from "next/navigation"
import { useEffect } from "react";

export default function Places(){

    const pathname = usePathname();

    const { primaryWallet } = useDynamicContext()


    useEffect(()=>{
        getReviewsByPlace(primaryWallet, pathname.split("/")[2])
    },[primaryWallet])

    return(
        <div></div>
    )
}