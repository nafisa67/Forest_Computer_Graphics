import * as THREE from 'three';

var vertexShaderSource =
`
varying vec2 v_UV;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  v_UV = uv;
}
`;

var fragmentShaderSource =
`
precision mediump float;
uniform sampler2D u_texture;
uniform vec3 u_lightColor;
uniform float u_time; // Time uniform for animation
varying vec2 v_UV;

void main() {
  vec4 texColor = texture2D(u_texture, v_UV);
  vec3 seasonalColor = vec3(sin(u_time), cos(u_time), 1.0);
  vec3 finalColor = mix(texColor.rgb, seasonalColor, smoothstep(0.0, 1.0, u_time));
  gl_FragColor = vec4(finalColor * u_lightColor, texColor.a);
}
`;

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.z = 30;

const ambient_light = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambient_light);   

const light = new THREE.PointLight(0xffffff, 100000, 400);
light.position.set(0, 200, 0);
scene.add(light);

const environmentGeometry = new THREE.BoxGeometry(300, 200, 300);
const skyTexture = new THREE.TextureLoader().load('texture/sky.jpg');
const groundTexture = new THREE.TextureLoader().load('texture/ground.jpg');

const environmentMaterials = [
    new THREE.MeshPhongMaterial({ map: skyTexture, side: THREE.BackSide }),
    new THREE.MeshPhongMaterial({ map: skyTexture, side: THREE.BackSide }), 
    new THREE.MeshPhongMaterial({ map: skyTexture, side: THREE.BackSide }), 
    new THREE.MeshPhongMaterial({ map: groundTexture, side: THREE.BackSide }),
    new THREE.MeshPhongMaterial({ map: skyTexture, side: THREE.BackSide }), 
    new THREE.MeshPhongMaterial({ map: skyTexture, side: THREE.BackSide }) 
];
const room = new THREE.Mesh(environmentGeometry, environmentMaterials);
room.position.set(0, 95, 0);
scene.add(room);

// Create cliffs
const cliffTexture = new THREE.TextureLoader().load('texture/cliff.jpg');  // Add a realistic cliff texture
const cliffMaterial = new THREE.MeshPhongMaterial({ map: cliffTexture });

function createCliff(width, height, depth, position) {
  const cliffGeometry = new THREE.BoxGeometry(width, height, depth);
  const cliff = new THREE.Mesh(cliffGeometry, cliffMaterial);
  cliff.position.set(position.x, position.y, position.z);
  return cliff;
}

// Example cliffs (size and position can be adjusted as needed)
const cliff1 = createCliff(100, 50, 20, { x: -150, y: 50, z: -150 });
const cliff2 = createCliff(120, 60, 30, { x: 150, y: 40, z: 150 });
// Removed the front cliff (cliff3)
// const cliff3 = createCliff(80, 70, 25, { x: 0, y: 55, z: -150 });

scene.add(cliff1, cliff2);  // Add only the remaining cliffs to the scene

// Create tree material
const tree_material = new THREE.ShaderMaterial( {
  uniforms:{
    u_texture: {
      value: new THREE.TextureLoader().load('texture/tree.jpg')
    },
    u_lightColor: {
      value: light.color.toArray()
    },
    u_time: {
      value: 0.0 
    }
  },
  vertexShader: vertexShaderSource,
  fragmentShader: fragmentShaderSource
}); 

// Trunk and branches
const trunk = new THREE.Mesh( new THREE.CylinderGeometry( 1, 1, 10, 32 ), tree_material ); 
const branch1 = new THREE.Mesh( new THREE.CylinderGeometry( .5, .8, 5, 32 ), tree_material ); 
const branch2 = new THREE.Mesh( new THREE.CylinderGeometry( .5, .8, 3.5, 32 ), tree_material ); 
branch1.rotation.z = -15 * Math.PI/180;
branch1.position.set(trunk.position.x + .9, trunk.position.y + 7, trunk.position.z);
branch2.rotation.z = 15 * Math.PI/180;
branch2.position.set(trunk.position.x - .7, trunk.position.y + 6, trunk.position.z);

// Leaves material
const leave_material = new THREE.ShaderMaterial( { 
  uniforms:{
    u_texture: {
      value: new THREE.TextureLoader().load('texture/leaves.jpg')
    },
    u_lightColor: {
      value: light.color.toArray()
    },
    u_time: {
      value: 0.0
    }
  },
  vertexShader: vertexShaderSource,
  fragmentShader: fragmentShaderSource
} ); 

const leaves1 = new THREE.Mesh( new THREE.SphereGeometry( 4, 32, 16 ), leave_material ); 
leaves1.position.y = trunk.position.y + 12;
leaves1.position.x = trunk.position.x + 3;

// Additional leaves for the tree
const leaves2 = new THREE.Mesh( new THREE.SphereGeometry( 3, 32, 16 ), leave_material ); 
leaves2.position.y = trunk.position.y + 10;
leaves2.position.x = trunk.position.x - 3;
leaves2.position.z = trunk.position.z + 2;

trunk.add(branch1, branch2, leaves1, leaves2);

// Clone trees
function generateRandomVector(min, max, minDistance, existingVectors) {
  while (true) {
    const x = Math.random() * (max - min) + min;
    const y = Math.random() * (max - min) + min;

    const newVector = new THREE.Vector2(x, y);

    let isFarEnough = true;
    for (const existingVector of existingVectors) {
      const distance = newVector.distanceTo(existingVector);
      if (distance < minDistance) {
        isFarEnough = false;
        break; 
      }
    }

    if (isFarEnough) {
      return newVector;
    }
  }
}

const minDistance = 10;
const minCoordinate = -100;
const maxCoordinate = 100;
const numVectors = 200;

const cloneTrees = [];

for (let i = 0; i < numVectors; i++) {
  cloneTrees[i] = trunk.clone(); 
  const newVector = generateRandomVector(
    minCoordinate,
    maxCoordinate,
    minDistance,
    cloneTrees.map(object3D => new THREE.Vector2(object3D.position.x, object3D.position.z))
  );
  cloneTrees[i].position.set(newVector.x, trunk.position.y, newVector.y);
}

scene.add(...cloneTrees);

function animate() {
  requestAnimationFrame(animate);
  leave_material.uniforms.u_time.value += 0.005;
  renderer.render(scene, camera);
}

animate();

function getRandomHexColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

let counter = 0;
window.addEventListener('click', function(event) {
  counter++;
  if (counter == 5) {
    counter = 0;
    light.color.set(0xffffff);
  } else {
    light.color.set(getRandomHexColor());
  }

  const lightColorArray = light.color.toArray();

  tree_material.uniforms.u_lightColor.value = new THREE.Vector3(
    lightColorArray[0],
    lightColorArray[1],
    lightColorArray[2]
  );

  leave_material.uniforms.u_lightColor.value = new THREE.Vector3(
    lightColorArray[0],
    lightColorArray[1],
    lightColorArray[2]
  );
});

const movespeed = 1;
const rotationspeed = 0.04;

window.addEventListener("keydown", (event) => {
  if (event.key == 'ArrowLeft') camera.position.x -= movespeed;
  if (event.key == 'ArrowRight') camera.position.x += movespeed;
  if (event.key == 'ArrowUp') camera.position.z -= movespeed;
  if (event.key == 'ArrowDown') camera.position.z += movespeed;
  if (event.key == 'l') camera.rotation.y += rotationspeed;
  if (event.key == 'r') camera.rotation.y -= rotationspeed;
});
