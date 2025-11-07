const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedContainer = document.getElementById("selectedProductsList");
const userInput = document.getElementById("userInput");
const generateRoutineBtn = document.getElementById("generateRoutine");
const clearSelectionsBtn = document.createElement("button");
clearSelectionsBtn.id = "clearSelections";
clearSelectionsBtn.className = "generate-btn";
clearSelectionsBtn.style.marginTop = "8px";
clearSelectionsBtn.style.backgroundColor = "#ff003b";

clearSelectionsBtn.textContent = "Clear Selections";
if (generateRoutineBtn && generateRoutineBtn.parentNode) {
  generateRoutineBtn.parentNode.insertBefore(
    clearSelectionsBtn,
    generateRoutineBtn.nextSibling
  );
}

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

function getSelectedIds() {
  try {
    const raw = localStorage.getItem("selectedProductIds");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((id) => Number(id)) : [];
  } catch (err) {
    return [];
  }
}

function saveSelectedIds(ids) {
  try {
    localStorage.setItem("selectedProductIds", JSON.stringify(ids));
  } catch (err) {}
}

function createProductCard(product) {
  const el = document.createElement("div");
  el.className = "product-card";
  el.dataset.category = product.category || "";
  el.dataset.id = product.id;
  el.innerHTML = `
    <img src="${product.image}" alt="${product.name}">
    <div class="product-info">
      <h3>${product.name}</h3>
      <p>${product.brand}</p>
      <p class="product-description">${product.description}</p>
    </div>
  `;
  return el;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  const selectedIds = getSelectedIds();
  productsContainer.innerHTML = "";
  products.forEach((product) => {
    if (selectedIds.includes(Number(product.id))) return;
    productsContainer.appendChild(createProductCard(product));
  });
}

//Adds items in product containers to selected products and removes from og container
productsContainer.addEventListener("click", function (event) {
  const product = event.target.closest(".product-card");
  if (!product) return;
  const id = Number(product.dataset.id);
  const selectedIds = getSelectedIds();
  if (!selectedIds.includes(id)) {
    selectedIds.push(id);
    saveSelectedIds(selectedIds);
  }
  product.classList.add("selected-products");
  selectedContainer.appendChild(product);
});

//Adds items in selected products to product containers and removes from og container
selectedContainer.addEventListener("click", function (event) {
  const product = event.target.closest(".product-card");
  if (!product) return;
  const id = Number(product.dataset.id);
  let selectedIds = getSelectedIds();
  selectedIds = selectedIds.filter((sid) => Number(sid) !== id);
  saveSelectedIds(selectedIds);
  product.classList.remove("selected-products");
  productsContainer.appendChild(product);
});

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

loadProducts().then((allProducts) => {
  const selectedIds = getSelectedIds();
  // clear existing selected container
  selectedContainer.innerHTML = "";
  selectedIds.forEach((id) => {
    const p = allProducts.find((prod) => Number(prod.id) === Number(id));
    if (p) selectedContainer.appendChild(createProductCard(p));
  });
});

// Clear all selections handler
clearSelectionsBtn.addEventListener("click", () => {
  saveSelectedIds([]);
  selectedContainer.innerHTML = "";
  loadProducts().then((allProducts) => {
    const currentCategory = categoryFilter.value;
    const toDisplay = currentCategory
      ? allProducts.filter((p) => p.category === currentCategory)
      : allProducts;
    displayProducts(toDisplay);
  });
});

generateRoutineBtn.addEventListener("click", async () => {
  const selectedProducts = selectedContainer.querySelectorAll(".product-card");
  if (selectedProducts.length === 0) {
    alert("Please select at least one product to generate a routine.");
    return;
  }

  let productNames = Array.from(selectedProducts).map(
    (card) => card.querySelector("h3").textContent
  );

  const routinePrompt = `Using the following products: ${productNames.join(
    ", "
  )}, create a personalized beauty routine using only those products unless specifically asked otherwise. Please keep the routine under 300 complete tokens.`;

  messages.push({ role: "user", content: routinePrompt });

  const placeholder = appendMessage("assistant", "Loading...");

  try {
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: messages,
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    const assistantMessage =
      data?.choices[0]?.message?.content || "No response";

    placeholder.textContent = assistantMessage;

    messages.push({ role: "assistant", content: assistantMessage });
  } catch (error) {
    appendMessage("assistant", "Error fetching from OpenAI API: " + error);
  }
});

let messages = [
  {
    role: "system",
    content: `You are a L’Oréal Beauty Assistant. Your job is to help users create personalized beauty routines, including skincare, haircare, makeup, and fragrance recommendations. Ask relevant questions about the user’s preferences, skin type, hair type, lifestyle, and beauty goals to generate a complete routine tailored to them.

    Once the routine is generated, users may ask follow-up questions in the chatbox. These questions will relate only to the generated routine or topics like skincare, haircare, makeup, fragrance, and other beauty-related areas. Answer all follow-up questions clearly, politely, and with helpful tips or guidance, without straying into unrelated topics. Always provide professional and friendly advice, and suggest L’Oréal products when appropriate.
            
    If the user's query is unrelated to beauty or the routine in any way, state that you do not know.
            
    Please make sure to keep the responses under 300 complete tokens.`,
  },
];

function escapeHtml(unsafe) {
  return unsafe
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function appendMessage(role, content) {
  const pageScroll = window.scrollY || window.pageYOffset || 0;

  const e1 = document.createElement("div");

  e1.classList.add("message");
  e1.classList.add(role === "user" ? "user" : "assistant");
  e1.textContent = content;
  chatWindow.appendChild(e1);

  try {
    chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: "smooth" });
  } catch (err) {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  requestAnimationFrame(() => {
    try {
      window.scrollTo({ top: pageScroll, behavior: "auto" });
    } catch (err) {
      window.scrollTo(0, pageScroll);
    }
  });

  return e1;
}

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userInputValue = userInput.value.trim();
  if (!userInputValue) return;

  appendMessage("user", userInputValue);
  messages.push({ role: "user", content: userInputValue });
  userInput.value = "";

  const placeholder = appendMessage("assistant", "Loading...");

  try {
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: messages,
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    const assistantMessage =
      data?.choices[0]?.message?.content || "No response";

    placeholder.textContent = assistantMessage;

    messages.push({ role: "assistant", content: assistantMessage });
  } catch (error) {
    appendMessage("assistant", "Error fetching from OpenAI API: " + error);
  }
});
