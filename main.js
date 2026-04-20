import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* =========================================
   1. PRELOADER, CUSTOM CURSOR & GSAP SETUP
========================================= */
// --- Custom Cursor ---
const cursorDot = document.querySelector('.cursor-dot');
const cursorOutline = document.querySelector('.cursor-outline');

let cursorVisible = false; // Track if cursor has been revealed

window.addEventListener('mousemove', (e) => {
    // Reveal cursor only when the user actually moves the mouse
    if (!cursorVisible) {
        gsap.to([cursorDot, cursorOutline], { opacity: 1, duration: 0.3 });
        cursorVisible = true;
    }
    
    gsap.to(cursorDot, { x: e.clientX, y: e.clientY, duration: 0 });
    gsap.to(cursorOutline, { x: e.clientX, y: e.clientY, duration: 0.15, ease: "power2.out" });
});

// --- Preloader Sequence ---
const phrases = [
    "INITIALIZING VOID...", 
    "SYNTHESIZING NEON...", 
    "CALIBRATING AURA...", 
    "ALMOST THERE...", 
    "READY."
];
let textIndex = 0;
const loaderText = document.getElementById('loader-text');

const textInterval = setInterval(() => {
    textIndex++;
    if(textIndex < phrases.length) {
        loaderText.innerText = phrases[textIndex];
    }
}, 500);

const loaderTl = gsap.timeline({
    onComplete: () => {
        clearInterval(textInterval);
        loaderText.innerText = "ACCESS GRANTED.";
        
        setTimeout(() => {
            gsap.to("#preloader", { 
                y: "-100%", 
                duration: 1.2, 
                ease: "expo.inOut",
                onComplete: initPageAnimations 
            });
        }, 400);
    }
});

loaderTl.to("#loader-bar", { width: "100%", duration: 2.5, ease: "power2.inOut" });

// --- Main Page Animations ---
function initPageAnimations() {
    gsap.to("#marquee", { x: "-50%", duration: 20, ease: "none", repeat: -1 });
    
    // Animate Header IN (From opacity 0 to 1)
    gsap.to("header", { opacity: 1, duration: 1, ease: "power3.out" });
    
    // Pre-set the words lower and flipped, then animate them UP and visible
    gsap.set(".hero-text .word", { y: 100, rotationX: -90 });
    gsap.to(".hero-text .word", { 
        y: 0, 
        opacity: 1, 
        rotationX: 0, 
        duration: 1.5, 
        delay: 0.2, 
        stagger: 0.2, 
        ease: "power4.out", 
        transformOrigin: "bottom center" 
    });
    
    // Animate the subtext IN (opacity 0.6 matches your CSS style)
    gsap.to(".hero-sub", { opacity: 0.6, duration: 1, delay: 1.5 });
}
/* =========================================
   2. THREE.JS 3D SCENE: GRID & PARTICLES
========================================= */
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x030305, 0.05); // Adds depth to the infinite grid

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1, 10);

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Bloom Post-Processing
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.1; bloomPass.strength = 1.5; bloomPass.radius = 0.8;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// --- Element 1: Infinite Neon Floor Grid ---
const gridHelper = new THREE.GridHelper(60, 60, 0x00ffcc, 0x002233);
gridHelper.position.y = -2;
scene.add(gridHelper);

// --- Element 2: Floating Ambient Particles ---
const particlesGeo = new THREE.BufferGeometry();
const particlesCount = 300;
const posArray = new Float32Array(particlesCount * 3);
for(let i=0; i<particlesCount*3; i++) {
    posArray[i] = (Math.random() - 0.5) * 20; // Spread across x,y,z
}
particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMat = new THREE.PointsMaterial({
    size: 0.03, color: 0x00ffcc, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending
});
const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
scene.add(particlesMesh);

// --- Element 3: Abstract Neon Shoe Shape ---
const shoeGroup = new THREE.Group();
const points = [];
for (let i = 0; i < 50; i++) {
    const t = i / 50;
    points.push(new THREE.Vector3((Math.sin(t * Math.PI) * 4) - 2, Math.cos(t * Math.PI * 1.5) * 1.5, Math.sin(t * Math.PI * 2) * 0.5));
}
const curve = new THREE.CatmullRomCurve3(points);
const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.15, 8, false);
const neonMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffcc }); 
const neonMesh = new THREE.Mesh(tubeGeo, neonMaterial);
shoeGroup.add(neonMesh);

const coreGeo = new THREE.TubeGeometry(curve, 64, 0.05, 8, false);
const coreMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const coreMesh = new THREE.Mesh(coreGeo, coreMaterial);
shoeGroup.add(coreMesh);
scene.add(shoeGroup);

// Interactive Mouse Variables
let mouseX = 0; let mouseY = 0;
let targetX = 0; let targetY = 0;
const windowHalfX = window.innerWidth / 2; const windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);
});

const clock = new THREE.Clock();

function animate3D() {
    targetX = mouseX * 0.001;
    targetY = mouseY * 0.001;
    const elapsedTime = clock.getElapsedTime();

    // Rotate shoe based on mouse
    shoeGroup.position.y = Math.sin(elapsedTime * 2) * 0.3;
    shoeGroup.rotation.y += 0.05 * (targetX - shoeGroup.rotation.y);
    shoeGroup.rotation.x += 0.05 * (targetY - shoeGroup.rotation.x);
    shoeGroup.rotation.y += 0.01; 

    // Move grid to simulate forward speed
    gridHelper.position.z = (elapsedTime * 2) % 1; 

    // Gently rotate particles
    particlesMesh.rotation.y = -elapsedTime * 0.05;
    particlesMesh.rotation.x = elapsedTime * 0.02;

    composer.render(); 
    requestAnimationFrame(animate3D);
}
animate3D();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight); composer.setSize(window.innerWidth, window.innerHeight);
});


/* =========================================
   3. PRODUCT DATABASE & SHOP LOGIC
========================================= */
const inventory = [
    { id: 1, name: "Jordan 1 Retro High Chicago", category: "jordan", price: 35000, img: "https://images.unsplash.com/photo-1595950653106-6c9cc1f851cd?auto=format&fit=crop&w=600&q=80" },
    { id: 2, name: "Nike Dunk Low Retro Panda", category: "dunk", price: 12000, img: "https://images.unsplash.com/photo-1597045566677-8cf032ed6634?auto=format&fit=crop&w=600&q=80" },
    { id: 3, name: "Yeezy Boost 350 V2 Bone", category: "yeezy", price: 28000, img: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=600&q=80" },
    { id: 4, name: "Jordan 4 Retro Military Black", category: "jordan", price: 42000, img: "https://images.unsplash.com/photo-1618354691229-88d47f285158?auto=format&fit=crop&w=600&q=80" },
    { id: 5, name: "Travis Scott Reverse Mocha", category: "jordan", price: 115000, img: "https://images.unsplash.com/photo-1584735174965-0ea0d367460c?auto=format&fit=crop&w=600&q=80" },
    { id: 6, name: "Nike SB Dunk Low Travis", category: "dunk", price: 145000, img: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=600&q=80" },
    { id: 7, name: "Yeezy Slide Onyx", category: "yeezy", price: 11000, img: "https://images.unsplash.com/photo-1646738917833-2a4c8eb6b780?auto=format&fit=crop&w=600&q=80" },
    { id: 8, name: "Jordan 3 Retro Cement", category: "jordan", price: 29000, img: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&w=600&q=80" },
    { id: 9, name: "Nike Dunk Low Syracuse", category: "dunk", price: 19500, img: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=600&q=80" },
    { id: 10, name: "Yeezy Foam Runner", category: "yeezy", price: 16000, img: "https://images.unsplash.com/photo-1617300301322-a7f457ff2215?auto=format&fit=crop&w=600&q=80" },
    { id: 11, name: "Jordan 1 Lost & Found", category: "jordan", price: 44000, img: "https://images.unsplash.com/photo-1608667508764-33cf0726b13a?auto=format&fit=crop&w=600&q=80" },
    { id: 12, name: "Jordan 4 Retro SB Pine", category: "jordan", price: 38000, img: "https://images.unsplash.com/photo-1552346154-21d32810baa3?auto=format&fit=crop&w=600&q=80" },
    { id: 13, name: "Nike Dunk Low UNC", category: "dunk", price: 24000, img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80" },
    { id: 14, name: "Yeezy Boost 700 Wave", category: "yeezy", price: 41000, img: "https://images.unsplash.com/photo-1612821745127-53855be9cbd1?auto=format&fit=crop&w=600&q=80" },
    { id: 15, name: "Jordan 11 Retro Cherry", category: "jordan", price: 27000, img: "https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=600&q=80" },
    { id: 16, name: "SB Dunk Chunky Dunky", category: "dunk", price: 165000, img: "https://images.unsplash.com/photo-1579338559194-a162d19bf842?auto=format&fit=crop&w=600&q=80" },
    { id: 17, name: "Jordan 4 Black Canvas", category: "jordan", price: 32000, img: "https://images.unsplash.com/photo-1603787081207-362bcef7c144?auto=format&fit=crop&w=600&q=80" },
    { id: 18, name: "Yeezy Boost 350 Zebra", category: "yeezy", price: 31000, img: "https://images.unsplash.com/photo-1581564998782-b7eec9b96eb9?auto=format&fit=crop&w=600&q=80" },
    { id: 19, name: "Travis Scott Phantom", category: "jordan", price: 78000, img: "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?auto=format&fit=crop&w=600&q=80" },
    { id: 20, name: "Nike Dunk Low Grey Fog", category: "dunk", price: 16000, img: "https://images.unsplash.com/photo-1605348532760-6753d2c43329?auto=format&fit=crop&w=600&q=80" }
];

let cart = [];

function getCartItem(id, size) { return cart.find(item => item.product.id === id && item.size === size); }

function renderProducts() {
    const grid = document.getElementById('product-grid');
    const categoryFilter = document.getElementById('filter-category').value;
    const sortFilter = document.getElementById('sort-price').value;
    grid.innerHTML = ''; 

    let filtered = inventory.filter(p => categoryFilter === 'all' || p.category === categoryFilter);
    if (sortFilter === 'low') filtered.sort((a, b) => a.price - b.price);
    if (sortFilter === 'high') filtered.sort((a, b) => b.price - a.price);

    filtered.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card hover-target';
        card.innerHTML = `
            <div class="product-img" style="background-image: url('${product.img}')"></div>
            <h3 class="product-title">${product.name}</h3>
            <div class="product-price">₹${product.price.toLocaleString('en-IN')}</div>
            <div class="size-selector">
                <label>Size (UK)</label>
                <select class="size-select" data-id="${product.id}" id="size-${product.id}">
                    <option value="6">6</option> <option value="7">7</option> <option value="8">8</option>
                    <option value="9">9</option> <option value="10">10</option> <option value="11">11</option>
                </select>
            </div>
            <div class="action-container" id="action-${product.id}"></div>
        `;
        grid.appendChild(card);
        updateCardActionUI(product.id);
    });

    initGSAPHoverEffects();
}

function updateCardActionUI(productId) {
    const sizeSelect = document.getElementById(`size-${productId}`);
    if (!sizeSelect) return;
    const size = sizeSelect.value;
    const actionContainer = document.getElementById(`action-${productId}`);
    const cartItem = getCartItem(productId, size);

    if (cartItem && cartItem.qty > 0) {
        actionContainer.innerHTML = `
            <div class="qty-control">
                <button class="qty-btn calc-btn" data-id="${productId}" data-size="${size}" data-delta="-1">-</button>
                <span class="qty-val">${cartItem.qty}</span>
                <button class="qty-btn calc-btn" data-id="${productId}" data-size="${size}" data-delta="1">+</button>
            </div>
        `;
    } else {
        actionContainer.innerHTML = `<button class="add-to-cart-btn" data-id="${productId}">Add to Cart</button>`;
    }
}

function addToCart(id, size) {
    const product = inventory.find(p => p.id === id);
    let existingItem = getCartItem(id, size);
    if (existingItem) existingItem.qty += 1;
    else cart.push({ product, size, qty: 1 });
    updateCartData(); updateCardActionUI(id);
}

function updateQty(id, size, delta) {
    let item = getCartItem(id, size);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) cart = cart.filter(i => !(i.product.id === id && i.size === size));
    }
    updateCartData(); updateCardActionUI(id);
}

document.getElementById('product-grid').addEventListener('click', (e) => {
    if (e.target.classList.contains('add-to-cart-btn')) {
        addToCart(parseInt(e.target.dataset.id), document.getElementById(`size-${e.target.dataset.id}`).value);
    } else if (e.target.classList.contains('calc-btn')) {
        updateQty(parseInt(e.target.dataset.id), e.target.dataset.size, parseInt(e.target.dataset.delta));
    }
});

document.getElementById('product-grid').addEventListener('change', (e) => {
    if (e.target.classList.contains('size-select')) updateCardActionUI(parseInt(e.target.dataset.id));
});

function updateCartData() {
    let totalItems = 0; let subtotal = 0;
    const cartItemsContainer = document.getElementById('cart-items');
    cartItemsContainer.innerHTML = '';

    cart.forEach(item => {
        totalItems += item.qty;
        let itemTotal = item.product.price * item.qty;
        subtotal += itemTotal;
        cartItemsContainer.innerHTML += `
            <div class="cart-item">
                <div class="cart-item-header">
                    <span class="cart-item-title">${item.product.name}</span>
                    <span style="color:var(--neon-accent); font-weight:bold;">₹${itemTotal.toLocaleString('en-IN')}</span>
                </div>
                <div class="cart-item-details">
                    <span>Size: UK ${item.size}</span>
                    <div style="display:flex; align-items:center; gap: 10px;">
                        <button style="background:transparent; color:#fff; border:none; padding:5px; cursor:none;" onclick="cartModifier(${item.product.id}, '${item.size}', -1)">-</button>
                        <span class="cart-item-qty">${item.qty}</span>
                        <button style="background:transparent; color:#fff; border:none; padding:5px; cursor:none;" onclick="cartModifier(${item.product.id}, '${item.size}', 1)">+</button>
                    </div>
                </div>
            </div>
        `;
    });

    document.getElementById('cart-count').innerText = totalItems;
    const gst = subtotal * 0.18;
    const shipping = subtotal > 0 ? (subtotal > 20000 ? 0 : 500) : 0; 
    const finalTotal = subtotal + gst + shipping;

    document.getElementById('cart-subtotal').innerText = subtotal.toLocaleString('en-IN');
    document.getElementById('cart-shipping').innerText = shipping === 0 && subtotal > 0 ? 'FREE' : shipping.toLocaleString('en-IN');
    document.getElementById('cart-gst').innerText = gst.toLocaleString('en-IN');
    document.getElementById('cart-total').innerText = finalTotal.toLocaleString('en-IN');
    document.getElementById('review-total').innerText = finalTotal.toLocaleString('en-IN');
}

window.cartModifier = function(id, size, delta) { updateQty(id, size, delta); };

let isCartOpen = false;
function toggleCart() {
    isCartOpen = !isCartOpen;
    gsap.to('#cart-modal', { right: isCartOpen ? "0%" : "-100%", duration: 0.8, ease: "power3.inOut" });
    if(isCartOpen) nextStep(1);
}

function nextStep(stepNumber) {
    document.querySelectorAll('.checkout-steps').forEach(el => el.classList.remove('step-active'));
    document.getElementById(`cart-step-${stepNumber}`).classList.add('step-active');
    gsap.from(`#cart-step-${stepNumber} > *`, { y: 20, opacity: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" });
}

document.getElementById('cart-toggle').addEventListener('click', toggleCart);
document.getElementById('close-cart').addEventListener('click', toggleCart);
document.getElementById('btn-review').addEventListener('click', () => { if(cart.length > 0) nextStep(2); });
document.getElementById('btn-confirm').addEventListener('click', () => nextStep(3));
document.getElementById('btn-back').addEventListener('click', () => nextStep(1));
document.getElementById('btn-return').addEventListener('click', () => { cart = []; updateCartData(); renderProducts(); toggleCart(); });
document.getElementById('filter-category').addEventListener('change', renderProducts);
document.getElementById('sort-price').addEventListener('change', renderProducts);

// Cursor Hover States for Elements
function initGSAPHoverEffects() {
    document.querySelectorAll('.hover-target').forEach(target => {
        target.addEventListener('mouseenter', () => {
            gsap.to(cursorOutline, { scale: 1.5, backgroundColor: "rgba(0,255,204,0.1)", duration: 0.2 });
        });
        target.addEventListener('mouseleave', () => {
            gsap.to(cursorOutline, { scale: 1, backgroundColor: "transparent", duration: 0.2 });
        });
    });
}

renderProducts();

/* =========================================
   5. DYNAMIC SCROLL NAV
========================================= */
const header = document.querySelector('header');

window.addEventListener('scroll', () => {
    // If the page is scrolled down more than 50 pixels, add the background
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        // If at the very top, remove it to go back to completely transparent
        header.classList.remove('scrolled');
    }
});