import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  RotateCcw,
  Receipt,
} from "lucide-react";


const products = [
  {
    id:1,
    name:"রং চা",
    price:10,
    image:"/assets/products/rong.png"
  },
  {
    id:2,
    name:"লেবু চা",
    price:10,
    image:"/assets/products/lebu.png"
  },
  {
    id:3,
    name:"দুধ চা",
    price:20,
    image:"/assets/products/milk.jpg"
  },
  {
    id:4,
    name:"স্পেশাল দুধ চা",
    price:30,
    image:"/assets/products/special.jpg"
  },
  {
    id:5,
    name:"মালাই চা",
    price:50,
    image:"/assets/products/malai.jpg"
  },
  {
    id:6,
    name:"কফি(হাফ)",
    price:30,
    image:"/assets/products/coffee.jpg"
  },
 {
    id:7,
    name:"কফি(ফুল)",
    price:50,
    image:"/assets/products/coffe.jpg"
  },
 {
    id:8,
    name:"পোড়ারুটি",
    price:30,
    image:"/assets/products/ruti.png"
  },
 {
    id:9,
    name:"চিপস",
    price:10,
    image:"/assets/products/bombay.jpg"
  },
 {
    id:10,
    name:"চিপস",
    price:20,
    image:"/assets/products/Alooz.jpg"
  },  
 {
    id:11,
    name:"চিপস",
    price:20,
    image:"/assets/products/twist.jpg"
  }, 
 {
    id:12,
    name:"পানি 500ml",
    price:20,
    image:"/assets/products/mum.jpg"
  }, 
  {
    id:13,
    name:"পানি 1L",
    price:30,
    image:"/assets/products/mum.jpg"
  },
 {
    id:14,
    name:"পানি 2L",
    price:40,
    image:"/assets/products/mum.jpg"
  },     
];


export default function Calculator(){

const [search,setSearch]=useState("");
const [cart,setCart]=useState([]);
const [paid,setPaid]=useState("");



const addProduct=(product)=>{

const exist=cart.find(
(item)=>item.id===product.id
);


if(exist){

setCart(
cart.map(item=>
item.id===product.id
?
{
...item,
qty:item.qty+1
}
:
item
)
)

}

else{

setCart([
...cart,
{
...product,
qty:1
}
])

}

}




const increase=(id)=>{

setCart(
cart.map(item=>
item.id===id
?
{
...item,
qty:item.qty+1
}
:
item
)
)

}




const decrease=(id)=>{

setCart(
cart
.map(item=>
item.id===id
?
{
...item,
qty:item.qty-1
}
:
item
)
.filter(item=>item.qty>0)
)

}




const remove=(id)=>{

setCart(
cart.filter(item=>item.id!==id)
)

}




const total=useMemo(()=>{

return cart.reduce(
(sum,item)=>
sum+(item.price*item.qty)
,0
)

},[cart])




const change =
Number(paid || 0)-total;




const productsFilter=
products.filter(item=>
item.name.includes(search)
)



return(

<div className="max-w-7xl mx-auto p-6">


<h1 className="
text-3xl 
font-bold 
text-green-700
mb-2
">
Tea Garden POS
</h1>


<p className="text-gray-500 mb-6">
Product click করলে order এ add হবে
</p>



<div className="
grid
lg:grid-cols-[1.5fr_1fr]
gap-6
">


{/* PRODUCT LIST */}


<div className="
bg-white
rounded-3xl
shadow
p-5
">


<div className="relative mb-5">

<Search
className="
absolute
left-3
top-3
text-gray-400
"
/>


<input

placeholder="Search tea..."

value={search}

onChange={
e=>setSearch(e.target.value)
}

className="
w-full
border
rounded-xl
pl-10
py-3
"
/>


</div>



<div className="space-y-3">


{
productsFilter.map(product=>(


<div

key={product.id}

onClick={()=>
addProduct(product)
}

className="
flex
items-center
gap-4
border
rounded-2xl
p-3
cursor-pointer
hover:border-green-600
hover:shadow
duration-300
"


>


<img

src={product.image}

className="
w-20
h-20
rounded-xl
object-cover
"

/>



<div className="flex-1">


<h3 className="font-bold text-lg">

{product.name}

</h3>


<p className="
text-green-700
font-bold
">

৳ {product.price}

</p>


</div>



<button

className="
bg-green-700
text-white
w-10
h-10
rounded-xl
"

>

<Plus/>

</button>



</div>



))
}



</div>


</div>






{/* CART */}


<div className="
bg-white
rounded-3xl
shadow-xl
p-5
h-fit
sticky
top-5
">



<div className="
flex
justify-between
items-center
">


<h2 className="
text-xl
font-bold
flex
gap-2
">

<ShoppingCart/>

Order


</h2>



<button
onClick={()=>{
setCart([]);
setPaid("");
}}

>

<RotateCcw
className="text-red-500"
/>

</button>


</div>




<div className="
mt-5
space-y-3
">


{

cart.length===0

?

<p className="
text-center
text-gray-400
py-10
">
No Product Added
</p>


:

cart.map(item=>(


<div
key={item.id}
className="
border
rounded-xl
p-3
flex
gap-3
">


<img
src={item.image}
className="
w-16
h-16
rounded-lg
object-cover
"
/>



<div className="flex-1">


<h4 className="font-bold">

{item.name}

</h4>


<p>
৳ {item.price}
</p>



<div className="
flex
items-center
gap-3
mt-2
">


<button
onClick={()=>
decrease(item.id)
}

className="
bg-gray-200
p-1
rounded
"
>

<Minus size={16}/>

</button>



<span className="font-bold">

{item.qty}

</span>



<button

onClick={()=>
increase(item.id)
}

className="
bg-green-700
text-white
p-1
rounded
"

>

<Plus size={16}/>

</button>




<button

onClick={()=>
remove(item.id)
}

className="
ml-auto
text-red-500
"

>

<Trash2 size={18}/>

</button>



</div>



</div>



</div>


))

}



</div>





<hr className="my-5"/>



<div className="space-y-3">


<div className="
flex
justify-between
text-xl
font-bold
">

<span>
Total
</span>

<span className="text-green-700">

৳ {total}

</span>


</div>



<label>
Customer Paid
</label>


<input

type="number"

value={paid}

onChange={
e=>setPaid(e.target.value)
}

placeholder="Example 500"

className="
w-full
border
rounded-xl
p-3
"
/>





<div className="
bg-gray-100
rounded-xl
p-4
">


<p>
Customer দিলো:
<b> ৳ {paid || 0}</b>
</p>


<p>
মোট বিল:
<b> ৳ {total}</b>
</p>



<p className="
text-green-700
font-bold
text-lg
">

ফেরত পাবে:
৳ {change>0?change:0}

</p>



{
change<0 &&
<p className="
text-red-500
font-bold
">

আরো দিতে হবে:
৳ {Math.abs(change)}

</p>
}



</div>




<button

className="
w-full
bg-green-700
text-white
py-3
rounded-xl
flex
justify-center
gap-2
font-bold
"

>

<Receipt/>

Complete Sale

</button>



</div>



</div>



</div>



</div>

)

}