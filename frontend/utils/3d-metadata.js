import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'

class Metadata3DService {
  constructor() {
    this.loader = new GLTFLoader()
    
    // Setup Draco compression loader
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
    this.loader.setDRACOLoader(dracoLoader)
  }

  /**
   * Extract comprehensive metadata from 3D model
   */
  async extractMetadata(file) {
    try {
      console.log('Extracting 3D model metadata:', file.name)
      
      const arrayBuffer = await file.arrayBuffer()
      const url = URL.createObjectURL(file)
      
      const metadata = {
        basic: await this.getBasicMetadata(file),
        technical: await this.getTechnicalMetadata(arrayBuffer, file.type),
        validation: await this.validateModel(arrayBuffer, file.type),
        preview: await this.generatePreview(url, file.type)
      }
      
      URL.revokeObjectURL(url)
      return metadata
      
    } catch (error) {
      console.error('Metadata extraction failed:', error)
      throw new Error(`Metadata extraction failed: ${error.message}`)
    }
  }

  /**
   * Get basic file metadata
   */
  async getBasicMetadata(file) {
    return {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      lastModified: file.lastModified,
      format: file.name.split('.').pop().toLowerCase()
    }
  }

  /**
   * Extract technical specifications from 3D model
   */
  async getTechnicalMetadata(arrayBuffer, fileType) {
    return new Promise((resolve, reject) => {
      if (fileType.includes('gltf') || fileType.includes('glb')) {
        this.loader.parse(arrayBuffer, '', (gltf) => {
          const scene = gltf.scene
          const stats = this.analyzeScene(scene)
          resolve(stats)
        }, reject)
      } else {
        // For other formats, return basic info
        resolve({
          vertices: 0,
          triangles: 0,
          materials: 0,
          textures: 0,
          animations: 0,
          format: fileType,
          note: 'Full analysis requires GLTF/GLB format'
        })
      }
    })
  }

  /**
   * Analyze 3D scene and extract technical specs
   */
  analyzeScene(scene) {
    let vertices = 0
    let triangles = 0
    let materials = new Set()
    let textures = new Set()
    let animations = scene.animations ? scene.animations.length : 0

    scene.traverse((object) => {
      if (object.isMesh) {
        const geometry = object.geometry
        if (geometry) {
          if (geometry.index) {
            triangles += geometry.index.count / 3
          } else if (geometry.attributes.position) {
            triangles += geometry.attributes.position.count / 3
          }
          vertices += geometry.attributes.position ? geometry.attributes.position.count : 0
        }

        if (object.material) {
          materials.add(object.material.uuid || object.material.name)
          
          // Count textures
          Object.values(object.material).forEach(value => {
            if (value && value.isTexture) {
              textures.add(value.uuid)
            }
          })
        }
      }
    })

    return {
      vertices: vertices,
      triangles: triangles,
      materials: materials.size,
      textures: textures.size,
      animations: animations,
      meshes: this.countMeshes(scene),
      lights: this.countLights(scene),
      cameras: this.countCameras(scene),
      fileSize: 'Calculated after upload',
      boundingBox: this.calculateBoundingBox(scene)
    }
  }

  /**
   * Count meshes in scene
   */
  countMeshes(scene) {
    let count = 0
    scene.traverse(object => {
      if (object.isMesh) count++
    })
    return count
  }

  /**
   * Count lights in scene
   */
  countLights(scene) {
    let count = 0
    scene.traverse(object => {
      if (object.isLight) count++
    })
    return count
  }

  /**
   * Count cameras in scene
   */
  countCameras(scene) {
    let count = 0
    scene.traverse(object => {
      if (object.isCamera) count++
    })
    return count
  }

  /**
   * Calculate bounding box of model
   */
  calculateBoundingBox(scene) {
    const box = new THREE.Box3()
    box.setFromObject(scene)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    
    return {
      width: size.x,
      height: size.y, 
      depth: size.z,
      center: { x: center.x, y: center.y, z: center.z },
      volume: size.x * size.y * size.z
    }
  }

  /**
   * Validate 3D model for web compatibility
   */
  async validateModel(arrayBuffer, fileType) {
    const issues = []

    // Check file size
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (arrayBuffer.byteLength > maxSize) {
      issues.push({
        level: 'warning',
        message: `File size (${(arrayBuffer.byteLength / (1024 * 1024)).toFixed(2)}MB) is large for web delivery`
      })
    }

    // Check format compatibility
    const supportedFormats = ['gltf', 'glb', 'obj', 'fbx', 'stl']
    const fileFormat = fileType.split('/').pop() || fileType
    if (!supportedFormats.includes(fileFormat.toLowerCase())) {
      issues.push({
        level: 'error',
        message: `Format ${fileFormat} may not be fully supported`
      })
    }

    // Try to load the model to check for errors
    if (fileType.includes('gltf') || fileType.includes('glb')) {
      try {
        await new Promise((resolve, reject) => {
          this.loader.parse(arrayBuffer, '', resolve, reject)
        })
      } catch (error) {
        issues.push({
          level: 'error',
          message: `Model loading failed: ${error.message}`
        })
      }
    }

    return {
      isValid: issues.filter(issue => issue.level === 'error').length === 0,
      issues: issues,
      recommendations: this.generateRecommendations(issues, arrayBuffer.byteLength)
    }
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations(issues, fileSize) {
    const recommendations = []

    if (fileSize > 10 * 1024 * 1024) { // 10MB
      recommendations.push('Consider compressing textures and using Draco compression')
    }

    if (fileSize > 50 * 1024 * 1024) { // 50MB
      recommendations.push('Model is very large. Consider splitting into smaller parts')
    }

    if (issues.some(issue => issue.message.includes('texture'))) {
      recommendations.push('Optimize textures for web (use JPEG/WebP, reduce resolution)')
    }

    return recommendations
  }

  /**
   * Generate preview image from 3D model
   */
  async generatePreview(modelUrl, fileType) {
    return new Promise((resolve) => {
      // For now, return a placeholder
      // In production, you'd use Three.js to render a preview
      resolve({
        type: 'placeholder',
        message: 'Preview generation would render model here',
        note: 'Implement Three.js rendering for actual preview generation'
      })
    })
  }

  /**
   * Get supported formats information
   */
  getSupportedFormats() {
    return {
      gltf: {
        name: 'GL Transmission Format',
        features: ['Textures', 'Animations', 'Materials', 'Compression'],
        bestFor: 'Web, Mobile, AR/VR'
      },
      glb: {
        name: 'GL Binary',
        features: ['Single File', 'Compressed', 'Fast Loading'],
        bestFor: 'Production, Performance'
      },
      obj: {
        name: 'Wavefront OBJ',
        features: ['Universal', 'Simple Geometry'],
        bestFor: 'Basic Models, 3D Printing'
      },
      fbx: {
        name: 'Filmbox',
        features: ['Animations', 'Complex Scenes'],
        bestFor: 'Professional 3D, Animations'
      },
      stl: {
        name: 'Stereolithography',
        features: ['3D Printing', 'Simple'],
        bestFor: '3D Printing, CAD'
      }
    }
  }
}

export const metadata3DService = new Metadata3DService()
export default metadata3DService