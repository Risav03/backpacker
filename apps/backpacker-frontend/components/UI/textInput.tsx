import React, { Dispatch } from 'react'

export const TextInput = ({content, setContent, heading, placeholder, type, required, limit}:{type?: string, required:boolean, content:string, setContent:Dispatch<string>, heading:string, placeholder:string, limit?:number}) => {
  return (
    <div className="w-full text-start flex flex-col">
          <input type={type} placeholder={placeholder} onChange={(e) => { setContent(e.target.value) }} value={content} className={`p-2 peer placeholder:text-web-gray/20 bg-web-textBox w-full focus:outline-none focus:text-web-accent-green focus:border-web-accent-green focus:border-2 rounded-lg border-[1px] border-slate-500/50 duration-200 `}></input>
          <h2 className={`text-sm text-semibold order-first mt-4 peer-focus:font-semibold duration-200 peer-focus:text-web-accent-green text-web-gray `}>{heading} {required && <span className="text-red-500 font-semibold ml-1">*</span>} {limit && <><span className={` ${content.length > limit && "text-red-500"} `}>{content.length}</span>/{limit && limit}</>}</h2>
      </div>
  )

}
