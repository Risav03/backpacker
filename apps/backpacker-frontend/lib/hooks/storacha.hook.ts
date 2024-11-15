import axios from 'axios';
import React, { useState } from 'react'

export const useStorachaHooks = () => {

  const[image, setImage] = useState<File|null>(null);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setImage(e.target.files[0]);
    }
};

  return {image, getRes, handleImageChange}
}
