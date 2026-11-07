# NIRKATHA Online Store — সেটআপ গাইড

এই প্রজেক্টে আছে:
- Admin Login ও visual Admin Dashboard
- Premium NIRKATHA storefront: responsive homepage, hero banner, product grid, search, category filters ও price sorting
- Product listing, দাম, বিবরণ ও সাইজ
- Cart এবং checkout
- অর্ডার API ও SQLite database
- ঢাকা delivery ৳60, ঢাকার বাইরে ৳120
- Cash on Delivery, bKash, Nagad, Upay payment method নির্বাচন
- Password-protected admin order API এবং product add/deactivate API

## নিজের কম্পিউটারে চালানো
1. Node.js 20+ ইনস্টল করুন।
2. এই ফোল্ডারে Terminal/Command Prompt খুলুন।
3. `npm install` চালান।
4. `.env.example` কপি করে `.env` বানান।
5. `.env`-এ শক্তিশালী `ADMIN_PASSWORD` এবং আপনার bKash/Nagad/Upay নম্বর দিন।
6. `npm start` চালান।
7. ব্রাউজারে `http://localhost:3000` খুলুন।

## Admin Dashboard
- ওয়েবসাইটের `/admin.html` পেজে গিয়ে `.env`-এর `ADMIN_PASSWORD` দিয়ে লগইন করুন।
- সেখান থেকে পণ্য যোগ/এডিট/লুকানো এবং অর্ডারের স্ট্যাটাস পরিবর্তন করতে পারবেন।
- পণ্যের ছবি আপাতত Image URL দিয়ে যোগ করতে হবে।

## Admin API
Header হিসেবে `x-admin-password: আপনার_ADMIN_PASSWORD` পাঠাতে হবে।
- সব অর্ডার: `GET /api/admin/orders`
- অর্ডারের অবস্থা: `PATCH /api/admin/orders/:id` body `{"status":"Confirmed"}`
- পণ্য যোগ: `POST /api/admin/products` body-তে `name`, `price`, ঐচ্ছিক `description`, `image`, `sizes`, `stock`
- পণ্য লুকানো: `DELETE /api/admin/products/:id`

## গুরুত্বপূর্ণ পেমেন্ট নোট
বর্তমান সংস্করণে bKash/Nagad/Upay হলো **ম্যানুয়াল পেমেন্ট নির্দেশনা + Transaction ID সংগ্রহ**; এটি স্বয়ংক্রিয় gateway payment নয়। স্বয়ংক্রিয় পেমেন্ট চালু করতে সংশ্লিষ্ট provider-এর merchant account, API credentials, callback/webhook এবং production verification লাগবে। কোনো secret key frontend-এ রাখবেন না।

## লাইভ করার আগে
- `.env`-এ merchant নম্বর ও শক্তিশালী admin password বসান।
- নিজের পণ্যের ছবি, নাম, দাম, বিবরণ ও সাইজ দিন।
- Hosting-এ persistent disk/volume নিশ্চিত করুন, কারণ SQLite `store.db` ফাইলে অর্ডার রাখে।
- HTTPS, backup, privacy/return policy, terms এবং delivery policy যোগ করুন।
- ফ্রি hosting-এর sleep/usage limit ও custom-domain শর্ত যাচাই করুন।
- এই MVP-তে admin-এর জন্য API আছে; আলাদা visual admin dashboard এখনো নেই।


## সংস্করণ 2 — NIRKATHA Fashion Store
এই সংস্করণটি একক ব্র্যান্ড NIRKATHA-এর জন্য সাজানো। ভবিষ্যতে Hoodie, T-Shirt, Sweatshirt, Accessories ইত্যাদি ক্যাটাগরি অ্যাডমিন প্যানেল থেকে যোগ করা যাবে। Admin panel: `/admin.html`।

## এখনো যেসব production integration বাকি
- Customer account registration/login ও secure persistent auto-login (বর্তমান cart browser localStorage-এ থাকে; এটি customer account নয়)।
- bKash/Nagad-এর automatic payment gateway; বর্তমানে manual payment instruction/Transaction ID flow।
- Product image upload storage; বর্তমান admin form image URL নেয়।
- Production deployment-এর আগে secure admin session, rate limiting, CSRF protection, HTTPS, database backup ও persistent storage কনফিগার করতে হবে।

**সতর্কতা:** এই প্যাকেজটি deployable starter/MVP; production-ready multi-user authentication বা automatic payment চালু আছে বলে ধরে নেবেন না। লাইভ করার আগে উপরের integration সম্পন্ন করুন।
