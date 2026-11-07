const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");
require("dotenv").config?.();

const app = express();
const db = new Database("store.db");
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

db.exec(`
CREATE TABLE IF NOT EXISTS products (
 id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT DEFAULT 'T-Shirt',
 price INTEGER NOT NULL, description TEXT DEFAULT '', image TEXT DEFAULT '', sizes TEXT DEFAULT 'S,M,L,XL',
 stock INTEGER DEFAULT 10, active INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS orders (
 id INTEGER PRIMARY KEY AUTOINCREMENT, customer_name TEXT NOT NULL, phone TEXT NOT NULL,
 address TEXT NOT NULL, area TEXT NOT NULL, payment_method TEXT NOT NULL,
 transaction_id TEXT DEFAULT '', subtotal INTEGER NOT NULL, delivery INTEGER NOT NULL,
 total INTEGER NOT NULL, items TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 status TEXT DEFAULT 'Pending'
);`);

const count = db.prepare("SELECT COUNT(*) n FROM products").get().n;
if (!count) {
 const seed = db.prepare("INSERT INTO products (name,category,price,description,image,sizes,stock) VALUES (?,?,?,?,?,?,?)");
 [
  ["NIRKATHA — Mountain State","Graphic T-Shirt",890,"A clean graphic inspired by mountains, sun and open skies.","https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900","S,M,L,XL,2XL",20],
  ["NIRKATHA — Essential Black","Essential T-Shirt",750,"Everyday comfort with a minimal NIRKATHA signature.","https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=900","S,M,L,XL,2XL",25],
  ["NIRKATHA — Nature Lines","Graphic T-Shirt",890,"Nature-led artwork with a relaxed everyday fit.","https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=900","S,M,L,XL,2XL",15]
 ].forEach(p => seed.run(...p));
}
const deliveryFee = area => area === "inside" ? 60 : 120;

app.get("/api/products", (req,res) => res.json(db.prepare("SELECT * FROM products WHERE active=1 ORDER BY id DESC").all()));
app.get("/api/products/:id", (req,res) => {
 const p = db.prepare("SELECT * FROM products WHERE id=? AND active=1").get(req.params.id);
 if (!p) return res.status(404).json({error:"Product not found"});
 res.json(p);
});
app.post("/api/orders", (req,res) => {
 const {customer_name,phone,address,area,payment_method,transaction_id="",items=[]} = req.body || {};
 if (!customer_name || !phone || !address || !area || !payment_method || !Array.isArray(items) || !items.length)
  return res.status(400).json({error:"সব তথ্য পূরণ করুন।"});
 let subtotal=0, normalized=[];
 for (const item of items) {
  const p=db.prepare("SELECT id,name,price,stock FROM products WHERE id=? AND active=1").get(Number(item.id));
  const qty=Math.max(1,Math.min(10,Number(item.qty)||1));
  if (!p || p.stock < qty) return res.status(400).json({error:`${p?.name || "একটি পণ্য"} বর্তমানে পর্যাপ্ত স্টকে নেই।`});
  subtotal += p.price*qty; normalized.push({id:p.id,name:p.name,price:p.price,qty});
 }
 const delivery=deliveryFee(area), total=subtotal+delivery;
 const info=db.prepare(`INSERT INTO orders (customer_name,phone,address,area,payment_method,transaction_id,subtotal,delivery,total,items)
 VALUES (?,?,?,?,?,?,?,?,?,?)`).run(customer_name,phone,address,area,payment_method,transaction_id,subtotal,delivery,total,JSON.stringify(normalized));
 for (const it of normalized) db.prepare("UPDATE products SET stock=stock-? WHERE id=?").run(it.qty,it.id);
 res.json({ok:true,order_id:info.lastInsertRowid,total,delivery});
});
function admin(req,res,next) {
 if (!process.env.ADMIN_PASSWORD || req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD)
  return res.status(401).json({error:"Admin password required"});
 next();
}
app.get("/api/admin/orders",admin,(req,res)=>res.json(db.prepare("SELECT * FROM orders ORDER BY id DESC").all().map(o=>({...o,items:JSON.parse(o.items)}))));
app.patch("/api/admin/orders/:id",admin,(req,res)=>{
 const allowed=["Pending","Confirmed","Shipped","Delivered","Cancelled"];
 if(!allowed.includes(req.body.status)) return res.status(400).json({error:"Invalid status"});
 db.prepare("UPDATE orders SET status=? WHERE id=?").run(req.body.status,req.params.id); res.json({ok:true});
});
app.post("/api/admin/products",admin,(req,res)=>{
 const {name,category="T-Shirt",price,description="",image="",sizes="S,M,L,XL,2XL",stock=0}=req.body;
 if(!name || !Number(price)) return res.status(400).json({error:"Name and price required"});
 const r=db.prepare("INSERT INTO products(name,category,price,description,image,sizes,stock) VALUES(?,?,?,?,?,?,?)").run(name,category,price,description,image,sizes,stock);
 res.json({ok:true,id:r.lastInsertRowid});
});

app.patch("/api/admin/products/:id",admin,(req,res)=>{
 const {name,category="T-Shirt",price,description="",image="",sizes="S,M,L,XL,2XL",stock=0}=req.body;
 if(!name || !Number(price)) return res.status(400).json({error:"Name and price required"});
 const r=db.prepare("UPDATE products SET name=?,category=?,price=?,description=?,image=?,sizes=?,stock=? WHERE id=?")
  .run(name,category,price,description,image,sizes,stock,req.params.id);
 res.json({ok:r.changes>0});
});
app.delete("/api/admin/products/:id",admin,(req,res)=>{db.prepare("UPDATE products SET active=0 WHERE id=?").run(req.params.id);res.json({ok:true});});
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
const port=process.env.PORT||3000;
app.listen(port,()=>console.log(`NIRKATHA store running on port ${port}`));