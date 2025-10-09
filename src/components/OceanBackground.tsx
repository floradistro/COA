'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

export default function GeometricBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x1a1a1a, 50, 200)
    
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.z = 80

    const renderer = new THREE.WebGLRenderer({ 
      alpha: true,
      antialias: true 
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    containerRef.current.appendChild(renderer.domElement)

    // Create geometric node network
    const nodeCount = 60
    const nodes: THREE.Mesh[] = []
    const nodeData: { position: THREE.Vector3; velocity: THREE.Vector3; rotation: THREE.Vector3 }[] = []
    
    // Node geometry - larger, more elegant shapes
    const nodeGeometries = [
      new THREE.OctahedronGeometry(1.4),
      new THREE.TetrahedronGeometry(1.7),
      new THREE.BoxGeometry(2.1, 2.1, 2.1),
      new THREE.IcosahedronGeometry(1.2),
      new THREE.DodecahedronGeometry(1.5)
    ]
    
    const nodeMaterial = new THREE.MeshBasicMaterial({
      color: 0x999999,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    })

    for (let i = 0; i < nodeCount; i++) {
      const geometry = nodeGeometries[Math.floor(Math.random() * nodeGeometries.length)]
      const node = new THREE.Mesh(geometry.clone(), nodeMaterial.clone())
      
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 180,
        (Math.random() - 0.5) * 140
      )
      
      node.position.copy(position)
      
      nodeData.push({
        position: position,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.03,
          (Math.random() - 0.5) * 0.03,
          (Math.random() - 0.5) * 0.03
        ),
        rotation: new THREE.Vector3(
          Math.random() * 0.01,
          Math.random() * 0.01,
          Math.random() * 0.01
        )
      })
      
      nodes.push(node)
      scene.add(node)
    }

    // Create connection lines between nearby nodes
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x666666,
      transparent: true,
      opacity: 0.2,
      linewidth: 1
    })
    
    const connectionLines: THREE.Line[] = []
    const maxDistance = 35

    // Add elegant accent particles
    const particleGeometry = new THREE.BufferGeometry()
    const particleCount = 200
    const particlePositions = new Float32Array(particleCount * 3)
    const particleSizes = new Float32Array(particleCount)
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      particlePositions[i3] = (Math.random() - 0.5) * 250
      particlePositions[i3 + 1] = (Math.random() - 0.5) * 250
      particlePositions[i3 + 2] = (Math.random() - 0.5) * 180
      particleSizes[i] = Math.random() * 2 + 0.5
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1))
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x888888,
      size: 1.5,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true
    })
    
    const particles = new THREE.Points(particleGeometry, particleMaterial)
    scene.add(particles)

    // Update connections function
    const updateConnections = () => {
      // Remove old lines
      connectionLines.forEach(line => scene.remove(line))
      connectionLines.length = 0
      
      // Create new connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const distance = nodes[i].position.distanceTo(nodes[j].position)
          
          if (distance < maxDistance) {
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
              nodes[i].position,
              nodes[j].position
            ])
            
            const line = new THREE.Line(lineGeometry, lineMaterial.clone())
            const opacity = 1 - (distance / maxDistance)
            ;(line.material as THREE.LineBasicMaterial).opacity = opacity * 0.2
            
            connectionLines.push(line)
            scene.add(line)
          }
        }
      }
    }

    // Animation
    let time = 0
    let frameCount = 0
    const animate = () => {
      requestAnimationFrame(animate)
      time += 0.003
      frameCount++

      // Update nodes with elegant motion
      nodes.forEach((node, i) => {
        const data = nodeData[i]
        
        // Update position with smooth motion
        node.position.add(data.velocity)
        
        // Bounce off boundaries with damping
        if (Math.abs(node.position.x) > 100) data.velocity.x *= -0.95
        if (Math.abs(node.position.y) > 90) data.velocity.y *= -0.95
        if (Math.abs(node.position.z) > 70) data.velocity.z *= -0.95
        
        // Smooth rotation
        node.rotation.x += data.rotation.x
        node.rotation.y += data.rotation.y
        node.rotation.z += data.rotation.z
        
        // Elegant opacity pulse
        const mat = node.material as THREE.MeshBasicMaterial
        mat.opacity = 0.4 + Math.sin(time * 1.5 + i * 0.3) * 0.15
      })

      // Update connections less frequently for performance
      if (frameCount % 4 === 0) {
        updateConnections()
      }

      // Elegant particle rotation
      particles.rotation.y = time * 0.05
      particles.rotation.x = time * 0.02

      // Graceful camera orbit
      camera.position.x = Math.sin(time * 0.08) * 4
      camera.position.y = Math.cos(time * 0.06) * 3
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      containerRef.current?.removeChild(renderer.domElement)
      renderer.dispose()
      nodes.forEach(node => node.geometry.dispose())
      particleGeometry.dispose()
      nodeMaterial.dispose()
      particleMaterial.dispose()
      lineMaterial.dispose()
      connectionLines.forEach(line => line.geometry.dispose())
    }
  }, [mounted])
  
  if (!mounted) return null

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-0"
      style={{ pointerEvents: 'none' }}
    />
  )
}

