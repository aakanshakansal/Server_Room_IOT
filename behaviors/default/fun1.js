import { PawnBehavior } from "../PrototypeBehavior";

class FunPawn extends PawnBehavior {
  setup() {
    let trm = this.service("ThreeRenderManager");
    let THREE = Microverse.THREE;

    // Adding the cube to the scene
    this.cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x000000 }) // Initial color is black
    );
    this.cube.userData.isBlack = true; // Track the initial color state (black)
    this.cube.position.set(-4.3, 0, 4.5); // Position the cube in the scene
    trm.scene.add(this.cube);

    // Adding the sphere to the scene
    this.sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x0000ff })
    );
    this.sphere.position.set(-4.3, 1, 4.5);
    trm.scene.add(this.sphere);

    // Adding initial 3D text to the sphere
    this.createTextMesh("Off"); // Initially, the text is "Off"
    trm.scene.add(this.textMesh);

    this.addClickListener(this.sphere);

    // Fetch data from API and update the cube color and text initially
    this.fetchDataAndUpdateCubeAndText();

    // Set up polling to refresh data and update the cube color and text periodically
    this.pollingInterval = setInterval(() => {
      this.fetchDataAndUpdateCubeAndText();
    }, 5000); // Poll every 5 seconds; adjust as needed

    // Tone mapping exposure settings
    if (this.actor._cardData.toneMappingExposure !== undefined) {
      trm.renderer.toneMappingExposure =
        this.actor._cardData.toneMappingExposure;
    }

    this.listen("updateShape", "updateShape");
  }

  createTextMesh(text) {
    let trm = this.service("ThreeRenderManager");
    let THREE = Microverse.THREE;

    // If there's an existing text mesh, remove it first
    if (this.textMesh) {
      trm.scene.remove(this.textMesh);
      this.textMesh.geometry.dispose();
      this.textMesh.material.dispose();
    }

    const fontLoader = new THREE.FontLoader();
    fontLoader.load(
      "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
      (font) => {
        const textGeometry = new THREE.TextGeometry(text, {
          font: font,
          size: 0.2,
          height: 0.05,
        });

        const textMaterial = new THREE.MeshStandardMaterial({
          color: 0xff0000,
        }); // Set text color to red
        this.textMesh = new THREE.Mesh(textGeometry, textMaterial);

        // Position the text mesh on the sphere
        this.textMesh.position.set(-4.3, 1.4, 4.8);
        trm.scene.add(this.textMesh);
      }
    );
  }

  addClickListener(object) {
    let trm = this.service("ThreeRenderManager");
    let THREE = Microverse.THREE;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseClick = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, trm.camera);

      const intersects = raycaster.intersectObject(object);

      if (intersects.length > 0) {
        this.toggleButtonState(); // Call the function to toggle the button state
      }
    };

    window.addEventListener("click", onMouseClick, false);
  }

  async toggleButtonState() {
    try {
      const response = await fetch(
        "https://full-duplex-dynalic-api.vercel.app/toggle-btn",
        {
          method: "POST", // Use POST method to toggle the state
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log(`Button state toggled. New state: ${data.btnState}`);

      // Update the text based on the new state
      if (data.btnState === 0) {
        this.createTextMesh("Off");
      } else if (data.btnState === 1) {
        this.createTextMesh("On");
      }

      // Optionally update the cube color based on the new state
      this.fetchDataAndUpdateCubeAndText();
    } catch (error) {
      console.error("Failed to toggle button state:", error);
    }
  }

  async fetchDataAndUpdateCubeAndText() {
    try {
      const response = await fetch(
        "https://full-duplex-dynalic-api.vercel.app/btn-state"
      ); // API to get the current button state
      const data = await response.json();
      console.log("data is ", data); // Adjust according to your API response structure

      // Update the cube color based on the state
      if (data.btnState === 0) {
        this.cube.material.color.set(0x000000); // Set color to black
        this.cube.userData.isBlack = true;
        this.createTextMesh("Off"); // Update text to "Off"
      } else if (data.btnState === 1) {
        this.cube.material.color.set(0xff0000); // Set color to red
        this.cube.userData.isBlack = false;
        this.createTextMesh("On"); // Update text to "On"
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }

  teardown() {
    console.log("teardown lights");
    let scene = this.service("ThreeRenderManager").scene;
    scene.background?.dispose();
    scene.environment?.dispose();
    scene.background = null;
    scene.environment = null;

    clearInterval(this.pollingInterval);
    scene.remove(this.cube);
    this.cube.geometry.dispose();
    this.cube.material.dispose();

    scene.remove(this.sphere);
    this.sphere.geometry.dispose();
    this.sphere.material.dispose();

    if (this.textMesh) {
      scene.remove(this.textMesh);
      this.textMesh.geometry.dispose();
      this.textMesh.material.dispose();
    }

    window.removeEventListener("click", this.onMouseClick);
  }
}

export default {
  modules: [
    {
      name: "FUN",
      pawnBehaviors: [FunPawn],
    },
  ],
};
