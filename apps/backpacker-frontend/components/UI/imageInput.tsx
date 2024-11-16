import Image from 'next/image'
import React from 'react'

export const ImageInput = ({image, handleChange}:{image:File, handleChange:(e: React.ChangeEvent<HTMLInputElement>)=>void}) => {
  return (
    <label htmlFor="dropzone-file" className="flex flex-col aspect-square items-center justify-center w-80 h-80 mt-10 border-2 border-web-textBoxShine border-dashed rounded-lg cursor-pointer p-2">
        <div className="flex flex-col items-center aspect-square overflow-hidden justify-center rounded-lg w-full h-full hover:bg-web-textBoxShine">
          {!image ? (
            <svg className="w-8 h-8 text-web-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
            </svg>
          ) : (
            <Image
              alt='Webbie Social User Profile Image'
              className='w-full h-full object-cover hover:scale-110 hover:opacity-30 duration-300'
              width={1000}
              height={1000}
              src={String(image instanceof File ? URL.createObjectURL(image) : image)}
            />
          )}
        </div>
        <input id="dropzone-file" type="file" accept='image/*' onChange={handleChange} className="hidden" />
      </label>
  )
}
