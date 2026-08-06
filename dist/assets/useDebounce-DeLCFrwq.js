import{r as o}from"./vendor-k-88g7mg.js";const n=(e,t=500)=>{const[r,s]=o.useState(e);return o.useEffect(()=>{const u=setTimeout(()=>{s(e)},t);return()=>clearTimeout(u)},[e,t]),r};export{n as u};
