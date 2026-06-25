import React, { createContext, useContext, useState, useEffect } from "react";
const API_URL = "https://spare-parts-shop2.onrender.com";

const addShopUser = async (
user: Omit<ShopUser, "shop_user_id" | "created_date">
) => {
try {
const token = localStorage.getItem("accessToken");

```
const response = await fetch(`${API_URL}/api/admin/shops`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    name: user.name,
    email: user.email,
    password: user.password,
    phone: user.phone,
    shopName: user.shop_name,
    isActive: user.is_active,
  }),
});

if (!response.ok) {
  const errorText = await response.text();
  console.error("Create Shop Error:", errorText);
  throw new Error(errorText);
}

const newShop = await response.json();

setAllShopUsers((prev) => [
  ...prev,
  {
    shop_user_id: newShop.id,
    name: newShop.name,
    email: newShop.email,
    password: user.password,
    phone: user.phone,
    shop_name: newShop.shopName,
    created_date: new Date().toISOString(),
    is_active: newShop.isActive,
  },
]);
```

} catch (error) {
console.error(error);
alert("Failed to create shop");
}
};

const loginShopUser = async (
email: string,
password: string
): Promise<boolean> => {
try {
const response = await fetch(`${API_URL}/api/shop-auth/login`, {
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
email,
password,
}),
});

```
if (!response.ok) {
  return false;
}

const data = await response.json();

localStorage.setItem("accessToken", data.accessToken);

setCurrentShopUser({
  shop_user_id: data.shopUser.id,
  name: data.shopUser.name,
  email: data.shopUser.email,
  password: "",
  phone: "",
  shop_name: data.shopUser.shopName,
  created_date: "",
  is_active: true,
});

return true;
```

} catch (error) {
console.error(error);
return false;
}
};
