// Links are rendered in HTML. JavaScript only handles unavailable product images.
document.querySelectorAll('.product-image').forEach(img => {
  function showFallback() {
    img.hidden = true;
    img.nextElementSibling.hidden = false;
  }
  img.addEventListener('error', showFallback, {once:true});
  if (img.complete && img.naturalWidth === 0) showFallback();
});
