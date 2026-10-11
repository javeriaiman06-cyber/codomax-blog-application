const STORAGE_KEY = "inkspace_blogs_v1";
const USER_KEY = "inkspace_demo_user_v1";
const SESSION_KEY = "inkspace_demo_session_v1";

const starterBlogs = [
  {id:"sample-1",title:"Small Habits, Big Changes",category:"Personal Growth",excerpt:"How tiny daily choices can help you build a more intentional life.",content:"Big changes do not always begin with big decisions. Often, progress comes from small actions repeated consistently. Start with one habit that feels manageable, make room for it in your day, and celebrate your progress. Over time, small steps can add up to meaningful change.",author:"InkSpace Team",date:"2026-09-10",sample:true},
  {id:"sample-2",title:"Technology That Brings Us Closer",category:"Technology",excerpt:"Exploring the ways thoughtful technology can help people connect and create.",content:"Technology is most useful when it helps people solve real problems. From sharing knowledge to collaborating across distances, digital tools can make creativity more accessible. The important thing is to use technology intentionally and keep people at the center of every decision.",author:"InkSpace Team",date:"2026-09-12",sample:true},
  {id:"sample-3",title:"The Art of Slow Travel",category:"Travel",excerpt:"Discover more by slowing down, noticing details, and meeting local people.",content:"Travel is not only about how many places you visit. It is also about the details you notice: a local market, a quiet street, a conversation, or a new flavor. Slow travel gives you room to be curious and to experience a destination beyond its checklist.",author:"InkSpace Team",date:"2026-09-15",sample:true}
];

let blogs = loadBlogs();
let currentUser = readStored(SESSION_KEY, null);
let editingId = null;
let toastTimer;

function readStored(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function loadBlogs() {
  const saved = readStored(STORAGE_KEY, null);
  return Array.isArray(saved) ? saved : [...starterBlogs];
}

function saveBlogs() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blogs));
  } catch (error) {
    showToast("Could not save. Check your browser storage settings.");
  }
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[character]);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function navigate(page) {
  const target = document.getElementById(page) ? page : "home";
  document.querySelectorAll(".page").forEach(section => {
    section.classList.toggle("hidden", section.id !== target);
  });
  document.querySelectorAll("[data-page]").forEach(link => {
    link.classList.toggle("active", link.dataset.page === target);
  });
  if (target === "dashboard") renderDashboard();
  if (target === "home") renderHome();
  window.scrollTo({top:0, behavior:"smooth"});
}

document.addEventListener("click", event => {
  const link = event.target.closest("[data-page]");
  if (!link) return;
  event.preventDefault();
  const page = link.dataset.page;
  if (page === "create" && !currentUser) {
    showToast("Please log in first to write a blog.");
    navigate("login");
    return;
  }
  if (page === "dashboard" && !currentUser) {
    showToast("Please log in to open your dashboard.");
    navigate("login");
    return;
  }
  navigate(page);
});

function updateAuthUI() {
  const loggedIn = Boolean(currentUser);
  document.getElementById("loginLink").classList.toggle("hidden", loggedIn);
  document.getElementById("registerLink").classList.toggle("hidden", loggedIn);
  document.getElementById("logoutBtn").classList.toggle("hidden", !loggedIn);
}

function blogCard(blog, dashboard = false) {
  const icons = {Technology:"💻", Lifestyle:"🌿", Travel:"✈️", Education:"📚", Creativity:"🎨", "Personal Growth":"✨"};
  const icon = icons[blog.category] || "✍️";
  const artClass = "art-" + ((Math.abs(String(blog.id).split("").reduce((sum,c)=>sum+c.charCodeAt(0),0)) % 5) + 1);
  const actions = dashboard && !blog.sample ? `
    <div class="card-actions">
      <button class="btn btn-light small-btn" data-edit="${escapeHTML(blog.id)}">Edit</button>
      <button class="btn small-btn delete-btn" data-delete="${escapeHTML(blog.id)}">Delete</button>
    </div>` : "";
  return `
    <article class="blog-card">
      <div class="card-art ${artClass}" aria-hidden="true">${icon}</div>
      <div class="card-body">
        <span class="category">${escapeHTML(blog.category)}</span>
        <h3>${escapeHTML(blog.title)}</h3>
        <p>${escapeHTML(blog.excerpt)}</p>
        <div class="card-meta"><span>By ${escapeHTML(blog.author || "InkSpace Writer")}</span><span>${escapeHTML(blog.date || "")}</span></div>
        <div class="card-actions"><button class="btn btn-light small-btn" data-read="${escapeHTML(blog.id)}">Read story →</button></div>
        ${actions}
      </div>
    </article>`;
}

function renderHome() {
  const search = document.getElementById("searchInput").value.trim().toLowerCase();
  const filtered = blogs.filter(blog =>
    [blog.title, blog.category, blog.excerpt, blog.content, blog.author]
      .some(value => String(value || "").toLowerCase().includes(search))
  );
  document.getElementById("blogGrid").innerHTML = filtered.map(blog => blogCard(blog)).join("");
  document.getElementById("emptyMessage").classList.toggle("hidden", filtered.length > 0);
}

function renderDashboard() {
  const mine = currentUser ? blogs.filter(blog => !blog.sample && blog.owner === currentUser.email) : [];
  document.getElementById("totalPosts").textContent = mine.length;
  document.getElementById("publishedPosts").textContent = mine.length;
  document.getElementById("dashboardGrid").innerHTML = mine.map(blog => blogCard(blog, true)).join("");
  document.getElementById("dashboardEmpty").classList.toggle("hidden", mine.length > 0);
}

function openArticle(id) {
  const blog = blogs.find(item => item.id === id);
  if (!blog) return;
  document.getElementById("articleContent").innerHTML = `
    <span class="category">${escapeHTML(blog.category)}</span>
    <h1>${escapeHTML(blog.title)}</h1>
    <p class="card-meta">By ${escapeHTML(blog.author || "InkSpace Writer")} · ${escapeHTML(blog.date || "")}</p>
    <p><strong>${escapeHTML(blog.excerpt)}</strong></p>
    <div class="article-text">${escapeHTML(blog.content)}</div>`;
  navigate("article");
}

document.addEventListener("click", event => {
  const readButton = event.target.closest("[data-read]");
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  if (readButton) openArticle(readButton.dataset.read);

  if (editButton) {
    const blog = blogs.find(item => item.id === editButton.dataset.edit);
    if (!blog || !currentUser || blog.owner !== currentUser.email) return;
    editingId = blog.id;
    document.getElementById("blogTitle").value = blog.title;
    document.getElementById("blogCategory").value = blog.category;
    document.getElementById("blogExcerpt").value = blog.excerpt;
    document.getElementById("blogContent").value = blog.content;
    document.getElementById("editorHeading").textContent = "Edit Your Blog";
    document.getElementById("publishBtn").textContent = "Save Changes";
    navigate("create");
  }

  if (deleteButton) {
    const blog = blogs.find(item => item.id === deleteButton.dataset.delete);
    if (!blog || !currentUser || blog.owner !== currentUser.email) return;
    if (confirm("Delete this blog post? This cannot be undone.")) {
      blogs = blogs.filter(item => item.id !== blog.id);
      saveBlogs();
      renderDashboard();
      renderHome();
      showToast("Blog deleted.");
    }
  }
});

document.getElementById("searchInput").addEventListener("input", renderHome);

document.getElementById("registerForm").addEventListener("submit", event => {
  event.preventDefault();
  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim().toLowerCase();
  const password = document.getElementById("registerPassword").value;
  const users = readStored(USER_KEY, []);
  if (users.some(user => user.email === email)) {
    showToast("An account with this email already exists.");
    return;
  }
  users.push({name, email, password});
  localStorage.setItem(USER_KEY, JSON.stringify(users));
  currentUser = {name, email};
  localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
  event.target.reset();
  updateAuthUI();
  showToast("Account created! Welcome to InkSpace.");
  navigate("dashboard");
});

document.getElementById("loginForm").addEventListener("submit", event => {
  event.preventDefault();
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  const users = readStored(USER_KEY, []);
  const user = users.find(item => item.email === email && item.password === password);
  if (!user) {
    showToast("Account not found or password incorrect. Register first if needed.");
    return;
  }
  currentUser = {name:user.name, email:user.email};
  localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
  event.target.reset();
  updateAuthUI();
  showToast("Welcome back, " + currentUser.name + "!");
  navigate("dashboard");
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  currentUser = null;
  localStorage.removeItem(SESSION_KEY);
  updateAuthUI();
  showToast("You have logged out.");
  navigate("home");
});

document.getElementById("blogForm").addEventListener("submit", event => {
  event.preventDefault();
  if (!currentUser) {
    showToast("Please log in first.");
    navigate("login");
    return;
  }
  const title = document.getElementById("blogTitle").value.trim();
  const category = document.getElementById("blogCategory").value;
  const excerpt = document.getElementById("blogExcerpt").value.trim();
  const content = document.getElementById("blogContent").value.trim();
  if (!title || !excerpt || !content) {
    showToast("Please complete all required fields.");
    return;
  }

  if (editingId) {
    const index = blogs.findIndex(blog => blog.id === editingId && blog.owner === currentUser.email);
    if (index !== -1) blogs[index] = {...blogs[index], title, category, excerpt, content};
    showToast("Your blog has been updated.");
  } else {
    blogs.unshift({
      id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
      title, category, excerpt, content,
      author: currentUser.name,
      owner: currentUser.email,
      date: new Date().toISOString().slice(0,10),
      sample: false
    });
    showToast("Your blog has been published!");
  }

  saveBlogs();
  resetEditor();
  renderHome();
  navigate("dashboard");
});

function resetEditor() {
  editingId = null;
  document.getElementById("blogForm").reset();
  document.getElementById("editorHeading").textContent = "Create a Blog";
  document.getElementById("publishBtn").textContent = "Publish Blog";
}

document.getElementById("cancelEdit").addEventListener("click", () => {
  resetEditor();
  navigate(currentUser ? "dashboard" : "home");
});

document.getElementById("year").textContent = new Date().getFullYear();
updateAuthUI();
renderHome();
navigate("home");
