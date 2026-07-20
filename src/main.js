import axios from "axios";

import iziToast from "izitoast";
import "izitoast/dist/css/iziToast.min.css";

import "./style.css";

axios.defaults.baseURL = "https://jsonplaceholder.typicode.com";

const refs = {
  loadUsersButton: document.querySelector("#load-users"),
  userFilterForm: document.querySelector("#user-filter-form"),
  userFilterInput: document.querySelector("#user-filter"),
  clearFilterButton: document.querySelector("#clear-filter"),
  userList: document.querySelector("#user-list"),
  usersLoading: document.querySelector("#users-loading"),

  postForm: document.querySelector("#post-form"),
  postList: document.querySelector("#post-list"),
  postsLoading: document.querySelector("#posts-loading"),
  loadMoreButton: document.querySelector("#load-more"),
  reloadPostsButton: document.querySelector("#reload-posts"),

  editModal: document.querySelector("#edit-modal"),
  editForm: document.querySelector("#edit-form"),
  closeModalButton: document.querySelector("#close-modal"),
};

let users = [];
let posts = [];
let currentPage = 1;

const postsPerPage = 5;

function showSuccess(message) {
  iziToast.success({
    title: "Başarılı",
    message,
    position: "topRight",
  });
}

function showError(message) {
  iziToast.error({
    title: "Hata",
    message,
    position: "topRight",
  });
}

function showInfo(message) {
  iziToast.info({
    title: "Bilgi",
    message,
    position: "topRight",
  });
}

function setButtonLoading(button, isLoading, loadingText, defaultText) {
  button.disabled = isLoading;
  button.textContent = isLoading ? loadingText : defaultText;
}

function createUserMarkup(user) {
  return `
    <li class="user-card">
      <h3>${escapeHtml(user.name)}</h3>

      <p>
        <strong>Kullanıcı adı:</strong>
        ${escapeHtml(user.username)}
      </p>

      <p>
        <strong>E-posta:</strong>
        <a href="mailto:${escapeHtml(user.email)}">
          ${escapeHtml(user.email)}
        </a>
      </p>

      <p>
        <strong>Şirket:</strong>
        ${escapeHtml(user.company?.name ?? "Şirket bilgisi yok")}
      </p>
    </li>
  `;
}

function renderUsers(userData) {
  if (userData.length === 0) {
    refs.userList.innerHTML = `
      <li class="empty-message">
        Aramanızla eşleşen kullanıcı bulunamadı.
      </li>
    `;

    return;
  }

  refs.userList.innerHTML = userData.map(createUserMarkup).join("");
}

async function loadUsers(username = "") {
  refs.usersLoading.classList.remove("is-hidden");

  setButtonLoading(
    refs.loadUsersButton,
    true,
    "Yükleniyor...",
    "Kullanıcıları Getir",
  );

  try {
    const params = {};

    if (username.trim()) {
      params.username = username.trim();
    }

    const response = await axios.get("/users", { params });

    users = response.data;
    renderUsers(users);

    showSuccess(`${users.length} kullanıcı getirildi.`);
  } catch (error) {
    console.error("Kullanıcı hatası:", error);

    showError("Kullanıcılar alınamadı. Daha sonra tekrar deneyin.");
  } finally {
    refs.usersLoading.classList.add("is-hidden");

    setButtonLoading(
      refs.loadUsersButton,
      false,
      "Yükleniyor...",
      "Kullanıcıları Getir",
    );
  }
}

function createPostMarkup(post) {
  return `
    <li class="post-card" data-id="${post.id}">
      <h3>${escapeHtml(post.title)}</h3>

      <p>${escapeHtml(post.body)}</p>

      <div class="post-actions">
        <button
          class="button button-secondary edit-button"
          type="button"
          data-id="${post.id}"
        >
          Düzenle
        </button>

        <button
          class="button button-danger delete-button"
          type="button"
          data-id="${post.id}"
        >
          Sil
        </button>
      </div>
    </li>
  `;
}

function renderPosts(postData, shouldAppend = false) {
  const markup = postData.map(createPostMarkup).join("");

  if (shouldAppend) {
    refs.postList.insertAdjacentHTML("beforeend", markup);
    return;
  }

  refs.postList.innerHTML = markup;
}

async function loadPosts({ reset = false } = {}) {
  if (reset) {
    currentPage = 1;
    posts = [];
    refs.postList.innerHTML = "";
  }

  refs.postsLoading.classList.remove("is-hidden");

  setButtonLoading(
    refs.loadMoreButton,
    true,
    "Yükleniyor...",
    "Daha Fazla Yükle",
  );

  try {
    const response = await axios.get("/posts", {
      params: {
        _limit: postsPerPage,
        _page: currentPage,
      },
    });

    const newPosts = response.data;

    if (newPosts.length === 0) {
      refs.loadMoreButton.classList.add("is-hidden");

      showInfo("Yüklenecek başka gönderi bulunmuyor.");
      return;
    }

    posts.push(...newPosts);
    renderPosts(newPosts, currentPage > 1);

    currentPage += 1;

    if (newPosts.length < postsPerPage) {
      refs.loadMoreButton.classList.add("is-hidden");
    } else {
      refs.loadMoreButton.classList.remove("is-hidden");
    }
  } catch (error) {
    console.error("Gönderi getirme hatası:", error);

    showError("Gönderiler alınamadı. Daha sonra tekrar deneyin.");
  } finally {
    refs.postsLoading.classList.add("is-hidden");

    setButtonLoading(
      refs.loadMoreButton,
      false,
      "Yükleniyor...",
      "Daha Fazla Yükle",
    );
  }
}

async function createPost(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const submitButton = form.querySelector('button[type="submit"]');

  const title = form.elements.title.value.trim();
  const body = form.elements.body.value.trim();

  if (!title || !body) {
    showError("Başlık ve içerik alanlarını doldurun.");
    return;
  }

  const newPost = {
    title,
    body,
    userId: 1,
  };

  setButtonLoading(
    submitButton,
    true,
    "Ekleniyor...",
    "Gönderi Ekle",
  );

  try {
    const response = await axios.post("/posts", newPost);

    const createdPost = {
      ...response.data,
      id: Date.now(),
    };

    posts.unshift(createdPost);

    refs.postList.insertAdjacentHTML(
      "afterbegin",
      createPostMarkup(createdPost),
    );

    form.reset();

    showSuccess("Yeni gönderi listeye eklendi.");
  } catch (error) {
    console.error("Gönderi oluşturma hatası:", error);

    showError("Gönderi eklenemedi. Daha sonra tekrar deneyin.");
  } finally {
    setButtonLoading(
      submitButton,
      false,
      "Ekleniyor...",
      "Gönderi Ekle",
    );
  }
}

function openEditModal(postId) {
  const post = posts.find(item => String(item.id) === String(postId));

  if (!post) {
    showError("Düzenlenecek gönderi bulunamadı.");
    return;
  }

  refs.editForm.elements.id.value = post.id;
  refs.editForm.elements.title.value = post.title;
  refs.editForm.elements.body.value = post.body;

  refs.editModal.classList.remove("is-hidden");
  document.body.classList.add("modal-open");
}

function closeEditModal() {
  refs.editModal.classList.add("is-hidden");
  document.body.classList.remove("modal-open");

  refs.editForm.reset();
}

async function updatePost(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const submitButton = form.querySelector('button[type="submit"]');

  const postId = form.elements.id.value;
  const title = form.elements.title.value.trim();
  const body = form.elements.body.value.trim();

  if (!title || !body) {
    showError("Başlık ve içerik boş bırakılamaz.");
    return;
  }

  setButtonLoading(
    submitButton,
    true,
    "Kaydediliyor...",
    "Değişiklikleri Kaydet",
  );

  try {
    await axios.patch(`/posts/${postId}`, {
      title,
      body,
    });

    const postIndex = posts.findIndex(
      post => String(post.id) === String(postId),
    );

    if (postIndex !== -1) {
      posts[postIndex] = {
        ...posts[postIndex],
        title,
        body,
      };
    }

    const postElement = refs.postList.querySelector(
      `.post-card[data-id="${postId}"]`,
    );

    if (postElement) {
      postElement.outerHTML = createPostMarkup(posts[postIndex]);
    }

    closeEditModal();

    showSuccess("Gönderi güncellendi.");
  } catch (error) {
    console.error("Gönderi güncelleme hatası:", error);

    showError("Gönderi güncellenemedi.");
  } finally {
    setButtonLoading(
      submitButton,
      false,
      "Kaydediliyor...",
      "Değişiklikleri Kaydet",
    );
  }
}

async function deletePost(postId, deleteButton) {
  const shouldDelete = window.confirm(
    "Bu gönderiyi silmek istediğinizden emin misiniz?",
  );

  if (!shouldDelete) {
    return;
  }

  setButtonLoading(deleteButton, true, "Siliniyor...", "Sil");

  try {
    await axios.delete(`/posts/${postId}`);

    posts = posts.filter(
      post => String(post.id) !== String(postId),
    );

    const postElement = refs.postList.querySelector(
      `.post-card[data-id="${postId}"]`,
    );

    postElement?.remove();

    showSuccess("Gönderi silindi.");
  } catch (error) {
    console.error("Gönderi silme hatası:", error);

    showError("Gönderi silinemedi.");

    setButtonLoading(deleteButton, false, "Siliniyor...", "Sil");
  }
}

function handlePostListClick(event) {
  const editButton = event.target.closest(".edit-button");
  const deleteButton = event.target.closest(".delete-button");

  if (editButton) {
    openEditModal(editButton.dataset.id);
    return;
  }

  if (deleteButton) {
    deletePost(deleteButton.dataset.id, deleteButton);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

refs.loadUsersButton.addEventListener("click", () => {
  loadUsers();
});

refs.userFilterForm.addEventListener("submit", event => {
  event.preventDefault();

  const searchValue = refs.userFilterInput.value.trim().toLowerCase();

  if (!searchValue) {
    renderUsers(users);
    return;
  }

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchValue),
  );

  renderUsers(filteredUsers);
});

refs.clearFilterButton.addEventListener("click", () => {
  refs.userFilterInput.value = "";
  renderUsers(users);
});

refs.postForm.addEventListener("submit", createPost);

refs.loadMoreButton.addEventListener("click", () => {
  loadPosts();
});

refs.reloadPostsButton.addEventListener("click", () => {
  loadPosts({ reset: true });
});

refs.postList.addEventListener("click", handlePostListClick);

refs.editForm.addEventListener("submit", updatePost);

refs.closeModalButton.addEventListener("click", closeEditModal);

refs.editModal.addEventListener("click", event => {
  if (event.target === refs.editModal) {
    closeEditModal();
  }
});

document.addEventListener("keydown", event => {
  if (
    event.key === "Escape" &&
    !refs.editModal.classList.contains("is-hidden")
  ) {
    closeEditModal();
  }
});

loadPosts({ reset: true });