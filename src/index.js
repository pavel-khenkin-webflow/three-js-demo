import { gsap } from 'gsap'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

// Определяем базовый URL текущего скрипта
const scriptSrc = document.currentScript?.src || window.location.href
const scriptBaseUrl = new URL('.', scriptSrc).href
const modelPath = `${scriptBaseUrl}models/model-demo.glb`

console.log('Инициализация...')
console.log('Базовый URL скрипта:', scriptBaseUrl)
console.log('Путь к модели:', modelPath)

const container = document.querySelector('.model_app')
if (!container) {
	console.error('Контейнер с классом .model_app не найден!')
} else {
	console.log('Контейнер найден:', container)

	// Получаем размеры контейнера
	const { clientWidth: width, clientHeight: height } = container

	// Создание сцены
	const scene = new THREE.Scene()
	console.log('Сцена создана')

	// Настройка камеры
	const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
	camera.position.z = 10
	console.log('Камера настроена:', camera)

	// Добавляем освещение
	const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
	directionalLight.position.set(5, 10, 7.5)
	scene.add(directionalLight)

	const ambientLight = new THREE.AmbientLight(0xffffff, 0.5) // Мягкий свет
	scene.add(ambientLight)

	console.log('Свет добавлен: основной и мягкий')

	// Создание рендера
	const renderer = new THREE.WebGLRenderer({ antialias: true })
	renderer.setSize(width, height)
	container.appendChild(renderer.domElement)
	console.log('Рендер настроен и добавлен в DOM')

	// Добавляем OrbitControls
	const controls = new OrbitControls(camera, renderer.domElement)
	controls.enableDamping = true // Плавное торможение
	controls.dampingFactor = 0.05
	controls.screenSpacePanning = false // Отключаем панорамирование по экрану
	controls.minDistance = 5 // Минимальный зум
	controls.maxDistance = 20 // Максимальный зум

	// Изоляция событий внутри контейнера
	container.addEventListener('wheel', event => event.preventDefault(), {
		passive: false,
	})

	// Переменные для взаимодействия
	let model // Главная модель
	let leftDoor, rightDoor // Двери
	const points = [] // Для хранения точек
	const doorStates = { left: false, right: false } // Состояние дверей

	// Настройка GLTFLoader с DRACOLoader
	const loader = new GLTFLoader()
	const dracoLoader = new DRACOLoader()
	dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
	loader.setDRACOLoader(dracoLoader)

	console.log('Загрузка модели начата...')
	loader.load(
		modelPath,
		gltf => {
			model = gltf.scene
			scene.add(model)
			console.log('Модель успешно загружена:', model)

			leftDoor = model.getObjectByName('leftDoor')
			rightDoor = model.getObjectByName('rightDoor')

			console.log('Левая дверь:', leftDoor)
			console.log('Правая дверь:', rightDoor)

			addPointsToDoors() // Добавляем точки
		},
		undefined,
		error => {
			console.error('Ошибка загрузки модели:', error)
		}
	)

	// Функция для создания точки
	const createPoint = () => {
		const geometry = new THREE.SphereGeometry(0.1, 32, 32) // Сфера радиусом 0.1
		const material = new THREE.MeshBasicMaterial({ color: 0xffffff }) // Белая точка
		return new THREE.Mesh(geometry, material)
	}

	// Добавляем точки на двери
	const addPointsToDoors = () => {
		if (leftDoor) {
			const leftPoint = createPoint()
			leftDoor.add(leftPoint) // Привязываем точку к левой двери
			leftPoint.position.set(0, 1, 0) // Ставим точку в центр двери
			points.push(leftPoint) // Сохраняем точку для raycasting
		}
		if (rightDoor) {
			const rightPoint = createPoint()
			rightDoor.add(rightPoint) // Привязываем точку к правой двери
			rightPoint.position.set(0, 1, 0) // Ставим точку в центр двери
			points.push(rightPoint) // Сохраняем точку для raycasting
		}
	}

	// Анимация
	const animate = () => {
		requestAnimationFrame(animate)
		controls.update() // Обновление OrbitControls
		renderer.render(scene, camera)
	}

	animate()

	// Адаптация рендера к размеру контейнера
	window.addEventListener('resize', () => {
		const { clientWidth: newWidth, clientHeight: newHeight } = container
		camera.aspect = newWidth / newHeight
		camera.updateProjectionMatrix()
		renderer.setSize(newWidth, newHeight)
		console.log('Размеры контейнера обновлены:', { newWidth, newHeight })
	})

	// Обработчик кликов по дверям и точкам
	container.addEventListener('click', event => {
		const mouse = new THREE.Vector2(
			(event.clientX / container.clientWidth) * 2 - 1,
			-(event.clientY / container.clientHeight) * 2 + 1
		)
		const raycaster = new THREE.Raycaster()
		raycaster.setFromCamera(mouse, camera)

		// Проверяем, попали ли в одну из точек
		const intersects = raycaster.intersectObjects(points)
		if (intersects.length > 0) {
			const clickedPoint = intersects[0].object
			console.log('Точка нажата:', clickedPoint)
			// Дополнительное действие, например, вывод текста
			return
		}

		// Проверяем, попали ли в дверь
		const doorIntersects = raycaster.intersectObjects([leftDoor, rightDoor])
		if (doorIntersects.length > 0) {
			const clickedObject = doorIntersects[0].object

			if (clickedObject === leftDoor) {
				doorStates.left = !doorStates.left
				const targetRotation = doorStates.left ? -Math.PI / 2 : 0 // Открываем налево
				gsap.to(leftDoor.rotation, { y: targetRotation, duration: 0.5 })
				console.log('Левая дверь обновлена, состояние:', doorStates.left)
			} else if (clickedObject === rightDoor) {
				doorStates.right = !doorStates.right
				const targetRotation = doorStates.right ? Math.PI / 2 : 0 // Открываем направо
				gsap.to(rightDoor.rotation, { y: targetRotation, duration: 0.5 })
				console.log('Правая дверь обновлена, состояние:', doorStates.right)
			}
		}
	})
}
