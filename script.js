// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBeZBCU_aL6WPohMZ9KtWR9tF8C_fCtXEQ",
  authDomain: "chatao-e43d9.firebaseapp.com",
  databaseURL: "https://chatao-e43d9-default-rtdb.firebaseio.com",
  projectId: "chatao-e43d9",
  storageBucket: "chatao-e43d9.firebasestorage.app",
  messagingSenderId: "195467648378",
  appId: "1:195467648378:web:a61468af2146f3cec38ac3"
};

// SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import {
  getFirestore, collection, addDoc, serverTimestamp, onSnapshot,
  query, orderBy, updateDoc, doc, increment, where
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, updateProfile, signOut
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";

// Init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// DOM refs
const texto = document.getElementById('texto');
const turma = document.getElementById('turma');
const btnPost = document.getElementById('btnPost');
const feed = document.getElementById('feed');
const empty = document.getElementById('empty');
const filtroTurma = document.getElementById('filtroTurma');
const busca = document.getElementById('busca');
const charCount = document.getElementById('charCount');

const btnUser = document.getElementById('btnUser');
const userPopover = document.getElementById('userPopover');
const menuOut = document.getElementById('menuOut');
const menuIn = document.getElementById('menuIn');
const userNameLabel = document.getElementById('userNameLabel');
const btnLogout = document.getElementById('btnLogout');

// Modals
const signupModal = document.getElementById('signupModal');
const loginModal = document.getElementById('loginModal');
const openSignUp = document.getElementById('openSignUp');
const openLogin = document.getElementById('openLogin');
const doSignUp = document.getElementById('doSignUp');
const doLogin = document.getElementById('doLogin');
const suEmail = document.getElementById('suEmail');
const suPass = document.getElementById('suPass');
const suPass2 = document.getElementById('suPass2');
const suDisplay = document.getElementById('suDisplay');
const suErr = document.getElementById('suErr');
const liEmail = document.getElementById('liEmail');
const liPass = document.getElementById('liPass');
const liErr = document.getElementById('liErr');
const lockPill = document.getElementById('lockPill');

// --- Utils ---
function openModal(modal) { modal.classList.add("open"); }
function closeModal(modal) { modal.classList.remove("open"); }
document.querySelectorAll("[data-close]").forEach(btn=>{
  btn.addEventListener("click", e=>{
    const id = e.target.dataset.close;
    closeModal(document.querySelector(id));
  });
});

// Toggle user popover
btnUser.addEventListener('click', ()=>{
  const isOpen = userPopover.classList.contains('open');
  userPopover.classList.toggle('open', !isOpen);
});

// --- Auth state ---
onAuthStateChanged(auth, user=>{
  if(user){
    // logado
    menuOut.style.display = "none";
    menuIn.style.display = "grid";
    userNameLabel.textContent = user.displayName || "Usuário";
    texto.disabled = false;
    turma.disabled = false;
    lockPill.style.display = "none";
    btnPost.style.display = "inline-block";
  } else {
    // deslogado
    menuOut.style.display = "grid";
    menuIn.style.display = "none";
    texto.disabled = true;
    turma.disabled = true;
    lockPill.style.display = "inline-flex";
    btnPost.style.display = "none";
  }
});

// --- Sign up ---
openSignUp.addEventListener('click', ()=>{
  closeModal(loginModal);
  openModal(signupModal);
});
doSignUp.addEventListener('click', async ()=>{
  suErr.textContent = "";
  if(suPass.value !== suPass2.value){
    suErr.textContent = "As senhas não conferem";
    return;
  }
  try{
    const cred = await createUserWithEmailAndPassword(auth, suEmail.value, suPass.value);
    await updateProfile(cred.user, { displayName: suDisplay.value });
    closeModal(signupModal);
  }catch(err){
    suErr.textContent = "Erro ao cadastrar. Tente novamente.";
  }
});

// --- Login ---
openLogin.addEventListener('click', ()=>{
  closeModal(signupModal);
  openModal(loginModal);
});
doLogin.addEventListener('click', async () => {
  liErr.textContent = "";
  try {
    await signInWithEmailAndPassword(auth, liEmail.value, liPass.value);
    closeModal(loginModal);
  } catch (err) {
    liErr.textContent = "Erro ao entrar. Tente novamente.";
  }
});


// --- Logout ---
btnLogout.addEventListener('click', ()=> signOut(auth));

// --- Contador caracteres ---
texto.addEventListener('input', ()=>{
  charCount.textContent = `${texto.value.length}/280`;
});

// --- Publicar ---
btnPost.addEventListener('click', async ()=>{
  if(!texto.value.trim()) return;
  try{
    await addDoc(collection(db, "posts"), {
      texto: texto.value,
      turma: turma.value || "",
      likes: 0,
      createdAt: serverTimestamp(),
      uid: auth.currentUser.uid
    });
    texto.value = "";
    charCount.textContent = "0/280";
    turma.value = "";
  }catch(err){
    alert("Erro ao postar: "+err.message);
  }
});

// --- Renderizar feed atualizado com toggle de likes ---
function renderPosts(posts){
  feed.innerHTML = "";
  if(posts.length === 0){
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  const user = auth.currentUser;

  posts.forEach(p=>{
    const hasLiked = user && p.likesBy?.includes(user.uid);
    const el = document.createElement('div');
    el.className = "post";
    el.innerHTML = `
      <div class="post-header">
        ${p.turma ? `<span class="badge">${p.turma}</span>`:""}
        <span class="time">${p.createdAt ? new Date(p.createdAt.seconds*1000).toLocaleString() : ""}</span>
      </div>
      <div class="content">${p.texto}</div>
      <div class="actions">
        <button class="like" data-id="${p.id}" aria-pressed="${hasLiked}">
          ❤️ ${p.likes || 0}
        </button>
      </div>
    `;
    feed.appendChild(el);

    const likeBtn = el.querySelector(".like");

    // Aplica efeito visual personalizado quando curtido
    if(hasLiked){
      likeBtn.style.background = "rgba(124, 137, 255, 0.3)"; // azul suave
      likeBtn.style.borderColor = "var(--accent)";
    } else {
      likeBtn.style.background = "rgba(124,137,255,.15)"; // padrão
      likeBtn.style.borderColor = "var(--stroke)";
    }

    // --- Listener toggle ---
    likeBtn.addEventListener("click", async ()=>{
      if(!user) return alert("Faça login para curtir.");

      const ref = doc(db,"posts",p.id);
      let newLikes = p.likes || 0;
      let newLikesBy = p.likesBy ? [...p.likesBy] : [];

      if(newLikesBy.includes(user.uid)){
        // Descurtir
        newLikesBy = newLikesBy.filter(uid => uid !== user.uid);
        newLikes--;
        likeBtn.style.background = "rgba(124,137,255,.15)";
        likeBtn.style.borderColor = "var(--stroke)";
      } else {
        // Curtir
        newLikesBy.push(user.uid);
        newLikes++;
        likeBtn.style.background = "rgba(124, 137, 255, 0.3)";
        likeBtn.style.borderColor = "var(--accent)";
      }

      // Atualiza Firestore
      await updateDoc(ref,{
        likes: newLikes,
        likesBy: newLikesBy
      });
    });
  });
}


// --- Listen realtime ---
let unsubscribe = null;
function startFeed(){
  if(unsubscribe) unsubscribe();

  let q = query(collection(db,"posts"), orderBy("createdAt","desc"));

  // filtro turma
  if(filtroTurma.value && filtroTurma.value!=="__todas__"){
    q = query(collection(db,"posts"),
      where("turma","==",filtroTurma.value),
      orderBy("createdAt","desc")
    );
  }

  unsubscribe = onSnapshot(q, snap=>{
    let posts = [];
    snap.forEach(doc=>{
      posts.push({...doc.data(), id:doc.id});
    });

    // busca
    const termo = busca.value.toLowerCase();
    if(termo){
      posts = posts.filter(p=> p.texto.toLowerCase().includes(termo));
    }

    renderPosts(posts);
  });
}

filtroTurma.addEventListener("change", startFeed);
busca.addEventListener("input", startFeed);

startFeed();
