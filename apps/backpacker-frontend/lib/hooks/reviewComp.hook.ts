'use client'
import React, { useState } from 'react'

export const useReviewHooks = () => {

    const[name, setName] = useState<string>("");
    const[description, setDescription] = useState<string>("");
    const[tags, setTags] = useState<string[]>([]);
    const[image, setImage] = useState<File>();

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    };

  return {
    name, setName, description, setDescription, tags, setTags, image, setImage, handleImageChange
  }
}
