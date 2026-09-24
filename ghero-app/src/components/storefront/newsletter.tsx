export default function Newsletter() {
  return (
    <section className="py-16 md:py-20 border-t border-baby-pink-deep/50">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <h2 className="font-heading text-3xl text-gold mb-4">Stay in Touch</h2>
        <p className="text-charcoal/60 mb-8 font-body">
          Follow us on Instagram for the latest collections, exclusive offers, and behind-the-scenes.
        </p>
        <a 
          href="https://instagram.com/ghero_0" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-8 py-3 bg-gold hover:bg-gold-dark text-white font-medium transition-colors"
        >
          Follow @ghero_0
        </a>
      </div>
    </section>
  );
}
