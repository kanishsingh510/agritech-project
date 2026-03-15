function debounce(fn, wait){ let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), wait); }; }

async function fetchProducts(params){
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/products?${qs}`, { headers: { 'Accept': 'application/json' } });
  if(!res.ok) return [];
  const data = await res.json();
  return data.products || [];
}

function productCard(p){
  const img = p.image || p.imagePath || 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1200&auto=format&fit=crop';
  const unit = p.unit || 'kg';
  const farmerName = (p.farmerId && p.farmerId.name) ? p.farmerId.name : 'Farmer';
  const farmerLoc = (p.farmerId && p.farmerId.location) ? p.farmerId.location : 'NA';
  return `
  <article class="group bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
    <div class="relative aspect-[4/3] bg-gray-100">
      <img src="${img}" alt="${p.name}" class="w-full h-full object-cover" loading="lazy"/>
      <span class="badge capitalize">${p.category}</span>
    </div>
    <div class="p-4 space-y-2">
      <h3 class="font-semibold text-lg">${p.name}</h3>
      <p class="text-sm text-gray-500 line-clamp-2">${p.description||''}</p>
      <div class="flex items-center justify-between">
        <div class="text-primary font-semibold">₹ ${Number(p.price).toFixed(2)} <span class="text-xs text-gray-500">/ ${unit}</span></div>
        <div class="text-xs text-gray-500">By ${farmerName} (${farmerLoc})</div>
      </div>
      <div class="grid grid-cols-2 gap-2 pt-2">
        <a href="/buyer/marketplace#" class="btn-secondary">View Details</a>
        <button data-product-id="${p._id}" class="btn-primary buyBtn">Buy Now</button>
      </div>
    </div>
  </article>`;
}

function bindBuy(){
  document.querySelectorAll('.buyBtn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const productId = btn.getAttribute('data-product-id');
      const res = await fetch('/payment/create-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId }) });
      const data = await res.json();
      const options = {
        key: data.key, amount: data.amount, currency: data.currency, name: 'AgriTech', description: 'Order Payment', order_id: data.orderId,
        handler: async function (response) { await fetch('/payment/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(response) }); window.location.href = '/buyer/dashboard'; }
      };
      new Razorpay(options).open();
    });
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  const grid = document.getElementById('grid');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const pills = document.getElementById('categoryPills');
  const params = new URLSearchParams(window.location.search);
  let category = (params.get('category')||'All');
  let q = (params.get('q')||'');
  let sort = (params.get('sort')||'newest');

  const update = debounce(async ()=>{
    const products = await fetchProducts({ category, q, sort });
    grid.innerHTML = products.map(productCard).join('');
    bindBuy();
    const newUrl = `${window.location.pathname}?${new URLSearchParams({category,q,sort}).toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, 300);

  if (searchInput) searchInput.addEventListener('input', (e)=>{ q = e.target.value; update(); });
  if (sortSelect) sortSelect.addEventListener('change', (e)=>{ sort = e.target.value; update(); });
  if (pills) pills.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-cat]');
    if(!btn) return; category = btn.getAttribute('data-cat'); update();
  });
});




