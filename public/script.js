// Fetch products and display them
fetch('/api/products')
  .then(response => response.json())
  .then(products => {
    const productList = document.getElementById('product-list');
    products.forEach(product => {
      const productDiv = document.createElement('div');
      productDiv.innerHTML = `
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <p>$${product.price}</p>
        <button onclick="addToCart('${product._id}', '${product.name}', ${product.price})">Add to Cart</button>
      `;
      productList.appendChild(productDiv);
    });
  });

let cart = [];

function addToCart(productId, productName, productPrice) {
  const product = cart.find(item => item.productId === productId);
  if (product) {
    product.quantity += 1;
  } else {
    cart.push({ productId, productName, productPrice, quantity: 1 });
  }
  renderCart();
}

function renderCart() {
  const cartItems = document.getElementById('cart-items');
  cartItems.innerHTML = '';
  cart.forEach(item => {
    cartItems.innerHTML += `<p>${item.productName} x ${item.quantity} - $${item.productPrice * item.quantity}</p>`;
  });
}

document.getElementById('checkout-btn').addEventListener('click', () => {
  const totalAmount = cart.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);
  fetch('/api/order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'auth-token': localStorage.getItem('auth-token')
    },
    body: JSON.stringify({ products: cart, totalAmount })
  }).then(response => response.json())
    .then(order => {
      alert('Order placed successfully!');
      cart = [];
      renderCart();
    }).catch(err => {
      alert('Error placing order');
    });
});
