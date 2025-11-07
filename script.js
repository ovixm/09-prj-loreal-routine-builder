/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedContainer = document.getElementById("selectedProductsList");

/* Worker URL for OpenAI API calls */
const workerUrl = "https://loreal-chatbot.mt-vu555.workers.dev/";

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
        <p class="product-description">${product.description}</p>
      </div>
    </div>
  `
    )
    .join("");
}

let messages;

//Adds items in product containers to selected products and removes from og container
productsContainer.addEventListener("click", function (event) {
  const product = event.target.closest(".product-card");
  if (!product) return;

  product.classList.add("selected-products");
  selectedContainer.appendChild(product);
});

//Adds items in selected products to product containers and removes from og container
selectedContainer.addEventListener("click", function (event) {
  const product = event.target.closest(".product-card");
  if (!product) return;

  product.classList.remove("selected-products");
  productsContainer.appendChild(product);
});


/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const userInputValue = userInput.value.trim();
  if (!userInputValue) return;

  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});
