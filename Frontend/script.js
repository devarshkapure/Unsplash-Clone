
// 🔑 YOUR UNSPLASH API KEY — KEEP SECRET LIKE FIRE RECIPE
// Go to https://unsplash.com/developers → make app → paste key below
const ACCESS_KEY = CONFIG.ACCESS_KEY; // <-- PASTE YOUR SHINY KEY HERE!!

const searchInput = document.querySelector(".navbar input");
const categoryLinks = document.querySelectorAll(
  ".categories a, .categories button"
);
const gallery = document.querySelector(".gallery");

// Hero elements
const heroTitle = document.getElementById("heroTitle");
const heroDescription = document.getElementById("heroDescription");
const heroSubmitBtn = document.getElementById("heroSubmitBtn");

// 🦴 CATEGORY DESCRIPTIONS — each cave section has its own story
const categoryData = {
  featured: {
    title: "Featured",
    description:
      "A curated selection of the most stunning and inspiring photographs, handpicked by our editorial team to showcase exceptional visual storytelling.",
  },
  "new fall": {
    title: "New Fall",
    description:
      "Celebrate the beauty of autumn with golden leaves, cozy atmospheres, and the warm tones that make fall a photographer's favorite season.",
  },
  wallpapers: {
    title: "Wallpapers",
    description:
      "From epic drone shots to inspiring moments in nature — enjoy the best background for your desktop or mobile.",
  },
  nature: {
    title: "Nature",
    description:
      "This category showcases nature's beauty, from vast landscapes to macro details, transporting viewers to the outdoors.",
  },
  "3d renders": {
    title: "3D Renders",
    description:
      "This category showcases digitally rendered creations that blend technology and art, exploring the limitless potential of digital creativity.",
  },
  experimental: {
    title: "Experimental",
    description:
      "This category invites photographers to explore new techniques and perspectives, pushing creative boundaries.",
  },
  film: {
    title: "Film",
    description:
      "Rediscover the timeless charm of analog photography — grain, light leaks, and the authentic warmth that only film can capture.",
  },
  "street photography": {
    title: "Street Photography",
    description:
      "Candid moments and urban stories captured on the streets of cities around the world, celebrating everyday life and human connection.",
  },
  architecture: {
    title: "Architecture",
    description:
      "From towering skyscrapers to minimalist interiors, explore the art of built environments and the beauty of structural design.",
  },
  textures: {
    title: "Textures",
    description:
      "Patterns, surfaces, and close-up details that reveal the hidden beauty in everyday materials and natural formations.",
  },
  travel: {
    title: "Travel",
    description:
      "Wander the world through stunning travel photography — iconic landmarks, hidden gems, and the spirit of adventure.",
  },
  people: {
    title: "People",
    description:
      "Portraits and candid shots that celebrate human emotion, diversity, and the stories written on every face.",
  },
};

// Update the hero section when category changes
function updateHero(categoryName) {
  const key = categoryName.toLowerCase();
  const data = categoryData[key] || {
    title: categoryName,
    description: `Explore the best ${categoryName} photos from creators worldwide.`,
  };

  heroTitle.textContent = data.title;
  heroDescription.textContent = data.description;
  heroSubmitBtn.textContent = `Submit to ${data.title}`;

  // Also update the page title
  document.title = `${data.title} | Unsplash Clone`;
}

// Modal elements
const modal = document.getElementById("photoModal");
const modalClose = document.getElementById("modalClose");
const modalImage = document.getElementById("modalImage");
const modalAvatar = document.getElementById("modalAvatar");
const modalAuthorName = document.getElementById("modalAuthorName");
const modalAuthorSub = document.getElementById("modalAuthorSub");
const modalDownloadBtn = document.getElementById("modalDownloadBtn");
const modalDate = document.querySelector("#modalDate span");
const modalCamera = document.querySelector("#modalCamera span");
const modalTags = document.getElementById("modalTags");
const modalRelated = document.getElementById("modalRelated");
const modalFeatured = document.getElementById("modalFeatured");

let searchTimeout = null;
let currentDownloadUrl = ""; // store download URL for current photo

// ========================================
// 🏹 GO HUNT PHOTOS FROM UNSPLASH API
// ========================================

async function fetchPhotos(query = "wallpapers", page = 1, perPage = 30, orderBy = "relevant") {
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&order_by=${orderBy}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${ACCESS_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API angry! Status: ${response.status}`);
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Caveman fetch fail:", error);
    showNoResults(true);
    return [];
  }
}

// 🦣 FETCH 90+ PHOTOS — 3 PAGES IN PARALLEL (30 each)
async function fetchManyPhotos(query = "wallpapers", orderBy = "relevant") {
  try {
    const [p1, p2, p3] = await Promise.all([
      fetchPhotos(query, 1, 30, orderBy),
      fetchPhotos(query, 2, 30, orderBy),
      fetchPhotos(query, 3, 30, orderBy),
    ]);

    // Combine all, remove duplicates by id
    const seen = new Set();
    return [...p1, ...p2, ...p3].filter((photo) => {
      if (seen.has(photo.id)) return false;
      seen.add(photo.id);
      return true;
    });
  } catch (error) {
    console.error("Caveman multi-fetch fail:", error);
    return [];
  }
}

// ========================================
// 🔍 FETCH SINGLE PHOTO DETAILS
// ========================================

async function fetchPhotoDetails(photoId) {
  try {
    const url = `https://api.unsplash.com/photos/${photoId}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${ACCESS_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API no give photo details! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Caveman detail fetch fail:", error);
    return null;
  }
}

// ========================================
// 🔗 FETCH RELATED PHOTOS
// ========================================

async function fetchRelatedPhotos(photoId) {
  try {
    const url = `https://api.unsplash.com/photos/${photoId}/related`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${ACCESS_KEY}`,
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.results ? data.results.slice(0, 6) : [];
  } catch (error) {
    console.error("Caveman related fetch fail:", error);
    return [];
  }
}

// ========================================
// 🎨 PAINT PHOTOS ON CAVE WALL (DOM)
// ========================================

function displayPhotos(photos) {
  gallery.innerHTML = "";

  if (photos.length === 0) {
    showNoResults(true);
    return;
  }

  showNoResults(false);

  const columns = [
    document.createElement("div"),
    document.createElement("div"),
    document.createElement("div"),
  ];
  columns.forEach((col) => col.classList.add("gallery-column"));

  photos.forEach((photo, index) => {
    const card = document.createElement("div");
    card.classList.add("photo-card");

    const altText = photo.alt_description || "Unsplash photo";
    const photographerName = photo.user.name || "Unknown Caveman";

    card.innerHTML = `
      <img
        src="${photo.urls.small}"
        alt="${altText}"
        loading="lazy">

      <div class="photo-info">
        <span>${photographerName}</span>
        <button class="card-download-btn" title="Download">↓</button>
      </div>
    `;

    // Click on card → open modal popup!
    card.addEventListener("click", () => {
      openModal(photo);
    });

    // Click download button → download, NOT open modal
    const dlBtn = card.querySelector(".card-download-btn");
    dlBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      dlBtn.textContent = "⏳";
      dlBtn.disabled = true;
      try {
        const resp = await fetch(photo.urls.full);
        const blob = await resp.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `unsplash-${photo.id}.jpg`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        dlBtn.textContent = "✓";
        setTimeout(() => { dlBtn.textContent = "↓"; dlBtn.disabled = false; }, 2000);
      } catch {
        dlBtn.textContent = "↓";
        dlBtn.disabled = false;
        showToast("Download failed 😢");
      }
    });

    columns[index % 3].appendChild(card);
  });

  columns.forEach((col) => gallery.appendChild(col));
}

// ========================================
// 🦣 OPEN THE BIG CAVE POPUP (MODAL)
// ========================================

async function openModal(photo) {
  // Show modal immediately with basic info
  modal.classList.add("active");
  document.body.style.overflow = "hidden"; // no scroll behind

  // Track current photo ID for like/bookmark
  currentPhotoId = photo.id;

  // Fill basic info right away (from search results data)
  modalImage.src = photo.urls.regular;
  modalImage.alt = photo.alt_description || "Photo";
  modalAvatar.src = photo.user.profile_image?.medium || "";
  modalAuthorName.textContent = photo.user.name || "Unknown";
  modalAuthorSub.textContent = photo.user.bio
    ? photo.user.bio.slice(0, 40)
    : "For Unsplash";

  // Store download URL for the download button
  currentDownloadUrl = photo.urls.full;

  // Update like/bookmark button states
  updateBookmarkBtn();
  updateLikeBtn();

  // Clear old data
  modalTags.innerHTML = '<span class="modal-loading">Loading tags...</span>';
  modalRelated.innerHTML =
    '<span class="modal-loading">Hunting related photos...</span>';

  // Format date
  const publishDate = new Date(photo.created_at);
  modalDate.textContent = `Published ${publishDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}`;

  // Fetch full details + related in parallel (caveman multitask!)
  const [details, relatedPhotos] = await Promise.all([
    fetchPhotoDetails(photo.id),
    fetchRelatedPhotos(photo.id),
  ]);

  // Fill camera info from full details
  if (details) {
    const exif = details.exif || {};
    const cameraInfo =
      exif.make && exif.model
        ? `${exif.make}, ${exif.model}`
        : exif.model || exif.make || "Camera info not available";
    modalCamera.textContent = cameraInfo;

    // Fill tags
    if (details.tags && details.tags.length > 0) {
      modalTags.innerHTML = "";
      details.tags.forEach((tag) => {
        const tagBtn = document.createElement("button");
        tagBtn.className = "modal-tag";
        tagBtn.textContent =
          tag.title.charAt(0).toUpperCase() + tag.title.slice(1);

        // Click tag → search for it!
        tagBtn.addEventListener("click", () => {
          closeModal();
          searchInput.value = tag.title;
          fetchManyPhotos(tag.title).then(displayPhotos);
        });

        modalTags.appendChild(tagBtn);
      });
    } else {
      modalTags.innerHTML = "";
    }

    // Update featured info
    if (details.topics && details.topics.length > 0) {
      modalFeatured.textContent = details.topics
        .map((t) => t.title)
        .join(", ");
    } else {
      modalFeatured.textContent = "Wallpapers";
    }
  } else {
    modalCamera.textContent = "Camera info not available";
    modalTags.innerHTML = "";
  }

  // Fill related photos
  if (relatedPhotos.length > 0) {
    modalRelated.innerHTML = "";
    relatedPhotos.forEach((relPhoto) => {
      const card = document.createElement("div");
      card.className = "modal-related-card";
      card.innerHTML = `
        <img src="${relPhoto.urls.small}" alt="${relPhoto.alt_description || "Related photo"}" loading="lazy">
        <div class="related-overlay">
          <div class="related-author">
            <img src="${relPhoto.user.profile_image?.small || ""}" alt="${relPhoto.user.name}">
            <span>${relPhoto.user.name}</span>
          </div>
        </div>
      `;

      // Click related photo → open THAT photo in modal!
      card.addEventListener("click", () => {
        // Scroll modal back to top
        modal.scrollTop = 0;
        openModal(relPhoto);
      });

      modalRelated.appendChild(card);
    });
  } else {
    modalRelated.innerHTML =
      '<p style="color:#888;font-size:14px;">No related images found.</p>';
  }
}

// ========================================
// ❌ CLOSE THE CAVE POPUP
// ========================================

function closeModal() {
  modal.classList.remove("active");
  document.body.style.overflow = ""; // restore scroll
  modalImage.src = "";
}

// Close when click X button
modalClose.addEventListener("click", closeModal);

// ========================================
// 📥 DOWNLOAD PHOTO — CAVEMAN CATCH FISH!
// ========================================

modalDownloadBtn.addEventListener("click", async () => {
  if (!currentDownloadUrl) return;

  // Change button text to show progress
  const originalText = modalDownloadBtn.innerHTML;
  modalDownloadBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
    Downloading...
  `;
  modalDownloadBtn.disabled = true;

  try {
    // Fetch the image as a blob
    const response = await fetch(currentDownloadUrl);
    const blob = await response.blob();

    // Create a temporary download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unsplash-photo-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();

    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error("Download fail! Caveman sad:", error);
    alert("Download failed. Try again!");
  }

  // Restore button
  modalDownloadBtn.innerHTML = originalText;
  modalDownloadBtn.disabled = false;
});

// Close when click dark background (not the popup itself)
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

// Close when press Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("active")) {
    closeModal();
  }
});

// ========================================
// 🔖 BOOKMARK BUTTON — SAVE TO CAVE WALL
// ========================================

let currentPhotoId = null; // track which photo is open

const modalBookmark = document.getElementById("modalBookmark");
let bookmarkedIds = JSON.parse(localStorage.getItem("bookmarks") || "[]");

function updateBookmarkBtn() {
  const isBookmarked = bookmarkedIds.includes(currentPhotoId);
  modalBookmark.style.color = isBookmarked ? "#111" : "";
  modalBookmark.style.background = isBookmarked ? "#f1f1f1" : "";
  modalBookmark.title = isBookmarked ? "Remove Bookmark" : "Bookmark";
}

modalBookmark.addEventListener("click", () => {
  if (!currentPhotoId) return;
  const idx = bookmarkedIds.indexOf(currentPhotoId);
  if (idx === -1) {
    bookmarkedIds.push(currentPhotoId);
    showToast("🔖 Bookmarked!");
  } else {
    bookmarkedIds.splice(idx, 1);
    showToast("Bookmark removed");
  }
  localStorage.setItem("bookmarks", JSON.stringify(bookmarkedIds));
  updateBookmarkBtn();
});

// ========================================
// ❤️ LIKE BUTTON — CAVEMAN LOVE PHOTO
// ========================================

const modalLike = document.getElementById("modalLike");
let likedIds = JSON.parse(localStorage.getItem("likes") || "[]");

function updateLikeBtn() {
  const isLiked = likedIds.includes(currentPhotoId);
  modalLike.style.color = isLiked ? "#e63946" : "";
  modalLike.style.background = isLiked ? "#fff0f0" : "";
  modalLike.querySelector("path").style.fill = isLiked ? "#e63946" : "none";
  modalLike.title = isLiked ? "Unlike" : "Like";
}

modalLike.addEventListener("click", () => {
  if (!currentPhotoId) return;
  const idx = likedIds.indexOf(currentPhotoId);
  if (idx === -1) {
    likedIds.push(currentPhotoId);
    showToast("❤️ Liked!");
  } else {
    likedIds.splice(idx, 1);
    showToast("Like removed");
  }
  localStorage.setItem("likes", JSON.stringify(likedIds));
  updateLikeBtn();
});

// ========================================
// 📤 SHARE BUTTON — SPREAD THE CAVE ART
// ========================================

document.querySelector(".modal-share-btn").addEventListener("click", () => {
  const url = modalImage.src;
  if (navigator.share) {
    navigator.share({ title: "Check out this photo!", url });
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => showToast("🔗 Link copied!"));
  } else {
    showToast("🔗 " + url);
  }
});

// ========================================
// ••• MORE BUTTON — SECRET CAVE MENU
// ========================================

const moreBtn = document.querySelector(".modal-more-btn");
let moreMenuOpen = false;
let moreMenu = null;

moreBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (moreMenuOpen && moreMenu) {
    moreMenu.remove();
    moreMenuOpen = false;
    return;
  }
  moreMenu = document.createElement("div");
  moreMenu.style.cssText = `
    position:absolute; background:#fff; border:1px solid #ddd;
    border-radius:8px; box-shadow:0 4px 20px rgba(0,0,0,0.15);
    z-index:9999; min-width:180px; overflow:hidden;
    right:28px; bottom:60px;
  `;
  const options = [
    { label: "🔗 Copy image link", action: () => { navigator.clipboard?.writeText(modalImage.src); showToast("Link copied!"); } },
    { label: "🖼️ View full size", action: () => window.open(currentDownloadUrl, "_blank") },
    { label: "📋 Copy photo ID", action: () => { navigator.clipboard?.writeText(currentPhotoId || ""); showToast("ID copied!"); } },
  ];
  options.forEach(opt => {
    const item = document.createElement("button");
    item.textContent = opt.label;
    item.style.cssText = "display:block;width:100%;padding:12px 16px;border:none;background:none;text-align:left;font-size:13px;cursor:pointer;";
    item.onmouseenter = () => item.style.background = "#f5f5f5";
    item.onmouseleave = () => item.style.background = "none";
    item.onclick = () => { opt.action(); moreMenu.remove(); moreMenuOpen = false; };
    moreMenu.appendChild(item);
  });
  document.querySelector(".modal-details").style.position = "relative";
  document.querySelector(".modal-details").appendChild(moreMenu);
  moreMenuOpen = true;
  setTimeout(() => document.addEventListener("click", closeMoreMenu, { once: true }), 0);
});

function closeMoreMenu() {
  if (moreMenu) { moreMenu.remove(); moreMenuOpen = false; }
}

// ========================================
// ☷ FILTER BUTTON — CAVEMAN SORT ROCKS
// ========================================

const filterBtn = document.querySelector(".filter-btn");
let filterMenuOpen = false;
let filterMenu = null;
let activeSort = "relevant";

filterBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (filterMenuOpen && filterMenu) {
    filterMenu.remove();
    filterMenuOpen = false;
    return;
  }
  filterMenu = document.createElement("div");
  filterMenu.style.cssText = `
    position:absolute; background:#fff; border:1px solid #ddd;
    border-radius:8px; box-shadow:0 4px 20px rgba(0,0,0,0.15);
    z-index:9999; min-width:200px; overflow:hidden;
    right:0; top:48px;
  `;
  const sorts = [
    { label: "✨ Relevant", value: "relevant" },
    { label: "🕐 Latest", value: "latest" },
    { label: "🔥 Popular", value: "popular" },
  ];
  const header = document.createElement("p");
  header.textContent = "Sort by";
  header.style.cssText = "padding:12px 16px 6px;font-size:11px;font-weight:700;color:#888;letter-spacing:1px;";
  filterMenu.appendChild(header);
  sorts.forEach(s => {
    const item = document.createElement("button");
    item.textContent = s.label + (activeSort === s.value ? " ✓" : "");
    item.style.cssText = "display:block;width:100%;padding:10px 16px;border:none;background:none;text-align:left;font-size:13px;cursor:pointer;";
    item.onmouseenter = () => item.style.background = "#f5f5f5";
    item.onmouseleave = () => item.style.background = "none";
    item.onclick = async () => {
      activeSort = s.value;
      filterMenu.remove(); filterMenuOpen = false;
      filterBtn.textContent = `☷ Filters (${s.label.split(" ")[1]})`;
      const currentCategory = document.querySelector(".categories a.active")?.textContent?.trim() || "wallpapers";
      const photos = await fetchManyPhotos(currentCategory, s.value);
      displayPhotos(photos);
      showToast(`Sorted by ${s.label.split(" ")[1]}`);
    };
    filterMenu.appendChild(item);
  });
  const wrapper = document.querySelector(".gallery-heading");
  wrapper.style.position = "relative";
  wrapper.appendChild(filterMenu);
  filterMenuOpen = true;
  setTimeout(() => document.addEventListener("click", closeFilterMenu, { once: true }), 0);
});

function closeFilterMenu() {
  if (filterMenu) { filterMenu.remove(); filterMenuOpen = false; }
}

// ========================================
// 🏛️ SIGN UP / LOG IN — REAL CAVE PAGES
// ========================================

document.querySelector(".signup").addEventListener("click", () => {
  window.location.href = "signup.html";
});

// Log in link is now a real <a href="login.html"> — no JS needed

// ========================================
// 📨 SUBMIT BUTTON — LINK TO SIGN UP
// ========================================

document.getElementById("heroSubmitBtn").addEventListener("click", () => {
  window.location.href = "signup.html";
});

// ========================================
// 🍞 TOAST NOTIFICATION — CAVEMAN SPEAK
// ========================================

function showToast(message) {
  let toast = document.getElementById("cave-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "cave-toast";
    toast.style.cssText = `
      position:fixed; bottom:30px; left:50%; transform:translateX(-50%) translateY(20px);
      background:#111; color:#fff; padding:12px 22px; border-radius:30px;
      font-size:14px; font-weight:500; z-index:99999;
      opacity:0; transition:opacity 0.3s, transform 0.3s; pointer-events:none;
      white-space:nowrap;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = "1";
  toast.style.transform = "translateX(-50%) translateY(0)";
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(20px)";
  }, 2500);
}

// ========================================
// 🚫 SHOW "NO RESULTS" SAD CAVE MESSAGE
// ========================================

function showNoResults(show) {
  let message = document.querySelector(".no-results");

  if (!message) {
    message = document.createElement("p");
    message.className = "no-results";
    message.textContent = "No wallpapers found. Try another search.";
    gallery?.after(message);
  }

  message.style.display = show ? "block" : "none";
}

// ========================================
// 🔍 SEARCH — WHEN HUMAN TYPE IN BOX
// ========================================

searchInput?.addEventListener("input", (event) => {
  const query = event.target.value.trim();

  clearTimeout(searchTimeout);

  searchTimeout = setTimeout(async () => {
    if (query.length > 2) {
      const photos = await fetchManyPhotos(query);
      displayPhotos(photos);
    } else if (query.length === 0) {
      const photos = await fetchManyPhotos("wallpapers");
      displayPhotos(photos);
    }
  }, 500);
});

// ========================================
// 🏷️ CATEGORIES — WHEN HUMAN CLICK BUTTON
// ========================================

categoryLinks.forEach((link) => {
  link.addEventListener("click", async (event) => {
    event.preventDefault();

    categoryLinks.forEach((item) => item.classList.remove("active"));
    link.classList.add("active");

    const category = link.textContent.trim();

    // 🦴 Update hero section to match selected category!
    updateHero(category);

    const photos = await fetchManyPhotos(category);
    displayPhotos(photos);
  });
});

// ========================================
// 🧠 INIT — UNGA BUNGA START!
// ========================================

// ========================================
// 🌅 HERO SLIDESHOW — 5 PHOTOS ROTATING
// ========================================

async function initHeroSlideshow() {
  const slides = document.querySelectorAll(".hero-slide");
  const hero = document.querySelector(".hero");
  const creditLink = document.getElementById("heroCreditLink");
  if (!slides.length) return;

  // Fetch 5 landscape-style photos for the background
  const photos = await fetchPhotos("landscape nature", 1, 5);
  if (!photos || photos.length === 0) return;

  // Fill all slides with background images
  const pool = photos.slice(0, 5);
  pool.forEach((photo, i) => {
    if (slides[i]) {
      slides[i].style.backgroundImage = `url('${photo.urls.regular}')`;
      slides[i].dataset.author = photo.user.name || "Unsplash";
      slides[i].dataset.authorUrl = photo.user.links?.html || "#";
    }
  });

  // Activate hero background mode (turns text white)
  hero.classList.add("has-bg");

  let current = 0;
  slides[0].classList.add("active");

  // Update credit for visible slide
  function updateCredit(idx) {
    if (!creditLink) return;
    creditLink.textContent = slides[idx].dataset.author || "Unsplash";
    creditLink.href = slides[idx].dataset.authorUrl || "#";
  }
  updateCredit(0);

  // Rotate every 5 seconds
  setInterval(() => {
    slides[current].classList.remove("active");
    current = (current + 1) % pool.length;
    slides[current].classList.add("active");
    updateCredit(current);
  }, 5000);
}

async function init() {
  if (ACCESS_KEY === "YOUR_ACCESS_KEY_HERE") {
    console.warn(
      "⚠️ HEY CAVEMAN! You no put API key yet! Go to https://unsplash.com/developers and get one!"
    );
    return;
  }

  const photos = await fetchManyPhotos("wallpapers");
  displayPhotos(photos);
  initHeroSlideshow();
}

init();
