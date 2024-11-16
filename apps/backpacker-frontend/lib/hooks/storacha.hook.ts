import axios from 'axios';
import React, { Dispatch, SetStateAction, useState } from 'react'

export const useStorachaHooks = ({image}:{image:File}) => {

  async function getRes(){
    try{
      const formdata = new FormData();
      formdata.append('image', image as File);

      const res = await axios.post("/api/client", formdata);
      console.log(res.data.cid);
    }
    catch(err){
      console.log(err);
    }
  }

  return {image, getRes}
}
