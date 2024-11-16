'use client'
import React from 'react'
import { TextInput } from '../UI/textInput'
import { useReviewHooks } from '@/lib/hooks/reviewComp.hook'
import { ImageInput } from '../UI/imageInput'
import { AreaInput } from '../UI/areaInput'

export const ReviewComponent = () => {

    const {name, setName, description, setDescription, tags, setTags, image, setImage, handleImageChange} = useReviewHooks();

  return (
    <div className='flex flex-col items-center justify-center'>
        <TextInput content={name} heading='Name' placeholder='Name your review' required={true} setContent={setName} limit={30} />
        <AreaInput content={description} heading='Description' limit={200} placeholder='Enter a description' required={true}  setContent={setDescription}  />
        <ImageInput handleChange={handleImageChange} image={image as File} />
    </div>
  )
}
