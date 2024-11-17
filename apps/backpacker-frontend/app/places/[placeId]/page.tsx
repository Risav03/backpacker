'use client'
import { useReviewsByPlace } from "@/lib/hooks/reviewsByPlace.hook";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { usePathname } from "next/navigation"
import { useEffect } from "react";

export default function Places(){

    const pathname = usePathname()
    const{reviews, getReviews} = useReviewsByPlace();

    useEffect(()=>{
        getReviews(pathname.split("/")[2]);
    },[pathname])

    return(
        <div>{reviews}</div>
    )
}