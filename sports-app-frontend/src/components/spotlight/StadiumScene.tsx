// src/components/spotlight/StadiumScene.tsx
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { STADIUM_BACKGROUNDS } from "@/constants/spotlightImages";

interface StadiumSceneProps {
  sport?: "football" | "basketball" | "tennis" | "volleyball" | "cricket" | "badminton";
  className?: string;
}

const StadiumScene: React.FC<StadiumSceneProps> = ({ sport = "football", className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const stadiumRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    scene.fog = new THREE.FogExp2(0x0a0a1a, 0.008);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.set(0, 5, 15);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404060);
    scene.add(ambientLight);
    
    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(5, 10, 7);
    mainLight.castShadow = true;
    scene.add(mainLight);
    
    const fillLight = new THREE.PointLight(0x4466cc, 0.5);
    fillLight.position.set(-3, 4, 5);
    scene.add(fillLight);
    
    const backLight = new THREE.PointLight(0xff6633, 0.3);
    backLight.position.set(0, 3, -5);
    scene.add(backLight);
    
    // Stadium group
    const stadiumGroup = new THREE.Group();
    
    // Ground (field)
    const groundGeometry = new THREE.CircleGeometry(8, 32);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: sport === "basketball" ? 0xcc8844 : 0x2d5a27,
      roughness: 0.7,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    stadiumGroup.add(ground);
    
    // Field markings (circle at center)
    const centerCircleGeometry = new THREE.RingGeometry(0.8, 1.2, 32);
    const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const centerCircle = new THREE.Mesh(centerCircleGeometry, lineMaterial);
    centerCircle.rotation.x = -Math.PI / 2;
    centerCircle.position.y = -0.49;
    stadiumGroup.add(centerCircle);
    
    // Light poles (simple)
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 7.5;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 1.5, 6), poleMaterial);
      pole.position.set(Math.cos(angle) * radius, -0.2, Math.sin(angle) * radius);
      stadiumGroup.add(pole);
      
      const lightSphere = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), new THREE.MeshStandardMaterial({ color: 0xffaa66, emissive: 0xff4411, emissiveIntensity: 0.5 }));
      lightSphere.position.set(Math.cos(angle) * radius, 0.6, Math.sin(angle) * radius);
      stadiumGroup.add(lightSphere);
    }
    
    stadiumRef.current = stadiumGroup;
    scene.add(stadiumGroup);
    
    // Floating particles (crowd energy)
    const particleCount = 800;
    const particlesGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 30;
      particlePositions[i * 3 + 1] = Math.random() * 8;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
    }
    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0x44aaff,
      size: 0.05,
      transparent: true,
      opacity: 0.4,
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
    
    // Animation
    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.008;
      
      // Gentle rotation
      stadiumGroup.rotation.y = Math.sin(time * 0.1) * 0.15;
      
      // Floating particles
      particles.rotation.y = time * 0.05;
      
      // Camera subtle movement
      camera.position.x = Math.sin(time * 0.2) * 0.3;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };
    animate();
    
    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, [sport]);
  
  return <div ref={containerRef} className={`absolute inset-0 -z-10 ${className}`} />;
};

export default StadiumScene;