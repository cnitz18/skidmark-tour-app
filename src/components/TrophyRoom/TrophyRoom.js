import React from 'react';
import './TrophyRoom.css';
import PageHeader from '../shared/PageHeader';
import fullLogo from '../../assets/Skidmark_Logo_1.png';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module';

const TrophyRoom = () => {
    const refContainer = useRef(null);
    
    useEffect(() => {
        // Make sure container exists
        if (!refContainer.current) return;
        
        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);
        
        // Camera setup
        const camera = new THREE.PerspectiveCamera(
            50, 
            refContainer.current.clientWidth / refContainer.current.clientHeight, 
            0.1, 
            1000
        );
        camera.position.z = 5;
        
        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(refContainer.current.clientWidth, refContainer.current.clientHeight);
        refContainer.current.appendChild(renderer.domElement);
        
        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        
        const spotLight = new THREE.SpotLight(0xffffff, 1);
        spotLight.position.set(0, 64, 32);
        spotLight.castShadow = true;
        scene.add(spotLight);
        
        // Sample cube
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshNormalMaterial();
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        
        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        // Add FPS stats
        const stats = new Stats();
        stats.dom.style.position = 'absolute'; // Use absolute positioning
        stats.dom.style.top = '0px';           // Position at top
        stats.dom.style.left = '0px';          // Position at left
        refContainer.current.appendChild(stats.dom);
        
        // Handle window resize
        const handleResize = () => {
            if (!refContainer.current) return;
            camera.aspect = refContainer.current.clientWidth / refContainer.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(refContainer.current.clientWidth, refContainer.current.clientHeight);
        };
        
        window.addEventListener('resize', handleResize);
        
        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            
            controls.update();
            stats.update();
            renderer.render(scene, camera);
        };
        
        animate();
        
        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (refContainer.current && renderer.domElement) {
                // eslint-disable-next-line react-hooks/exhaustive-deps
                refContainer.current.removeChild(renderer.domElement);
            }
            // Dispose resources
            renderer.dispose();
            geometry.dispose();
            material.dispose();
        };
    }, []);

    return (
        <div className="trophy-room">
            <PageHeader 
                title="Trophy Room (under construction)" 
                subtitle="Our team iRacing achievements and AMS2 championship winners."
                logo={fullLogo}
            />
            <div ref={refContainer} className="canvas-container" id="trophyCanvas"></div>
        </div>
    );
};

export default TrophyRoom;