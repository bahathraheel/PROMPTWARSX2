/**
 * ELITE ELECTION — Main Application Orchestrator
 * Manages lifecycle, scene state, UI synchronization, and resources.
 */
class CoreApp {
  constructor() {
    this.sceneManager = null;
    this.zoneBuilder = null;
    this.lightingRig = null;
    this.particles = null;
    this.postEffects = null;
    this.scrollController = null;
    this.interactions = null;
    this.assistantUI = null;
    this.zonesData = [];
    this.infiniteMenuInstance = null;

    this.dom = {
      loadingScreen: document.getElementById("loading-screen"),
      loadingBar: document.getElementById("loading-bar"),
      loadingText: document.getElementById("loading-text"),
      hero: document.getElementById("hero-overlay"),
      zoneLabel: document.getElementById("zone-label"),
      infoOverlay: document.getElementById("info-overlay"),
      progress: document.getElementById("scroll-progress")
    };
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      this._updateLoading(10, "Fetching election data...");
      this.zonesData = await this._fetchZones();

      this._updateLoading(25, "Initializing 3D viewport...");
      this.sceneManager = new SceneManager("three-canvas");

      this._updateLoading(40, "Calibrating lighting rig...");
      this.lightingRig = new LightingRig(this.sceneManager.scene);

      this._updateLoading(55, "Generating election zones...");
      this.zoneBuilder = new ZoneBuilder(this.sceneManager.scene);

      this._updateLoading(70, "Igniting particle systems...");
      this.particles = new ParticleSystem(this.sceneManager.scene, 400);

      this._updateLoading(85, "Establishing interaction protocols...");
      this.interactions = new Interactions(this.sceneManager.scene, this.sceneManager.camera, this.sceneManager.canvas);
      
      this._updateLoading(90, "Awakening Gnan AI...");
      this.assistantUI = new AssistantUI();
      
      this._setupCoreSystems();
      this._bindGlobalEvents();
      this._startLoop();

      this._updateLoading(100, "Ready to go!");
      setTimeout(() => this._hideLoading(), 800);
    } catch (error) {
      console.error("[App] Boot failure:", error);
      this._updateLoading(100, "Error loading application. Please refresh.");
    }
  }

  /**
   * Internal loading bar updater
   */
  _updateLoading(percent, text) {
    if (this.dom.loadingBar) this.dom.loadingBar.style.width = `${percent}%`;
    if (this.dom.loadingText) this.dom.loadingText.textContent = text;
  }

  _hideLoading() {
    this.dom.loadingScreen?.classList.add("hidden");
    this.sceneManager?.start();
  }

  async _fetchZones() {
    const res = await fetch("/api/zones");
    const data = await res.json();
    return data.success ? data.data : [];
  }

  _setupCoreSystems() {
    // Scroll handling
    this.scrollController = new ScrollController(this.sceneManager.camera, (zone, idx) => this._onZoneChange(zone, idx));
    
    // Post FX
    this.postEffects = new PostEffects(this.sceneManager);

    // Ground logic
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 500),
      new THREE.MeshPhongMaterial({ color: 0x0a0a1e, flatShading: true, side: THREE.DoubleSide })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -4, -100);
    ground.receiveShadow = true;
    this.sceneManager.addToScene(ground);
  }

  _bindGlobalEvents() {
    // Navigation & dots delegation
    document.addEventListener("click", (e) => {
      const target = e.target.closest("[data-zone]");
      if (target) {
        const idx = this.scrollController.getZoneIndex(target.dataset.zone);
        if (idx >= 0) this.scrollController.scrollToZone(idx);
      }
    });

    // Hero interaction
    document.getElementById("hero-chat-btn")?.addEventListener("click", () => this.assistantUI?.openPanel());

    // Navigation Menu (BubbleMenu)
    const bubbleContainer = document.getElementById("bubble-menu-container");
    if (bubbleContainer) {
      new BubbleMenu(bubbleContainer, {
        logo: '<span style="font-weight:800; font-family:var(--font-display);">🗳️ ELITE</span>',
        useFixedPosition: true,
        items: [
          { label: 'Register', zone: 'registration', href: '#' },
          { label: 'Timeline', zone: 'timeline', href: '#' },
          { label: 'Polling', zone: 'polling', href: '#' },
          { label: 'Results', zone: 'results', href: '#' },
          { label: 'Welcome', zone: 'welcome', href: '#' }
        ]
      });
      document.querySelector('.nav-bar')?.remove(); // Clean up old nav
    }
  }

  async _onZoneChange(zoneName, index) {
    // UI state sync
    this.dom.hero?.classList.toggle("hidden", index > 0);
    this._updateNavState(zoneName, index);

    // Fetch and display zone details
    const res = await fetch(`/api/zones/${zoneName}`);
    const data = await res.json();
    if (data.success && index > 0) {
      this._updateInfoOverlay(data.data);
      this.assistantUI?.setZone(zoneName, data.data);
    } else {
      this.dom.infoOverlay?.classList.remove("visible");
      this.dom.zoneLabel?.classList.remove("visible");
    }

    // Camera/Lighting logic
    this.lightingRig?.highlightZone(zoneName);
  }

  _updateNavState(zoneName, index) {
    document.querySelectorAll(".zone-dot").forEach((dot, i) => dot.classList.toggle("active", i === index));
    if (this.dom.progress) {
      const pct = Math.round(((index + 1) / 5) * 100);
      this.dom.progress.style.width = `${pct}%`;
    }
  }

  _updateInfoOverlay(detail) {
    if (!this.dom.infoOverlay) return;
    this.dom.infoOverlay.querySelector("#info-title").textContent = detail.name;
    this.dom.infoOverlay.querySelector("#info-desc").textContent = detail.description;
    this.dom.infoOverlay.classList.add("visible");
    
    const label = this.dom.zoneLabel;
    if (label) {
      label.querySelector("#zone-label-text").textContent = detail.name;
      label.classList.add("visible");
    }
  }

  _startLoop() {
    this.sceneManager?.onAnimate((delta, elapsed) => {
      this.zoneBuilder?.animate(elapsed);
      this.particles?.animate(elapsed);
      this.postEffects?.animate(elapsed);
      this.interactions?.update();
    });
  }
}

// ─── Entry Point ───
document.addEventListener("DOMContentLoaded", () => {
  window.app = new CoreApp();
  window.app.init();
});
