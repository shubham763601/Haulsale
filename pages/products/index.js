import React, {useEffect, useState} from 'react'
import { supabase } from '../../lib/supabaseClient'
export default function Products() {
  const [list,setList]=useState([])
  useEffect(()=>{ supabase.from('products').select('*, product_variants(*)').limit(20).then(r=>setList(r.data||[])) },[])
  return <div>{list.map(p=> <div key={p.id}><h3>{p.title}</h3><div>min price: {p.product_variants?.[0]?.price}</div></div>)}</div>
}