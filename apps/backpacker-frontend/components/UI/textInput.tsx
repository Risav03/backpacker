import React, { Dispatch } from 'react'

export const TextInput = ({content, setContent, heading, placeholder, type, required, limit}:{type?: string, required:boolean, content:string, setContent:Dispatch<string>, heading:string, placeholder:string, limit?:number}) => {
  return (
    <div className="w-full text-start flex flex-col">
          <input type={type} placeholder={placeholder} onChange={(e) => { setContent(e.target.value) }} value={content} className={`p-2 peer placeholder:text-web-gray/50 bg-web-textBox/10 w-full focus:outline-none focus:border-web-accent-blue-2 focus:border-2 rounded-lg border-[1px] text-black border-slate-500/50 duration-200 `}></input>
          <h2 className={`text-sm text-semibold order-first mt-4 peer-focus:font-semibold duration-200 peer-focus:text-web-accent-blue-2 text-web-gray `}>{heading} {required && <span className="text-red-500 font-semibold ml-1">*</span>} {limit && <><span className={` ${content.length > limit && "text-red-500"} `}>{content.length}</span>/{limit && limit}</>}</h2>
      </div>
  )

}
