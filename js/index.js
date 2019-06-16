
/* 如果按照真实的比例建模，观赏性不太好。所以对模型按照不同的比例进行了缩小 */

//太阳 + 八大行星物理数据：[赤道半径(km), 黄赤交角(°), 自转周期(天)]
var planetGeo = [
    [695500, 7.25,  25.05],
    [2439,   1,     58.65],
    [6052,   2.6,   -243],
    [6378.2, 23.43, 0.99726],
    [3398,   25.19, 1.02569],
    [71398,  3.12,  0.41006],
    [60330,  26.73, 0.42638],
    [25560,  97.86, 0.71805],
    [24760,  29.56, 0.67152]
];


//太阳 + 八大行星轨道数据：[轨道半长径(km), 轨道倾角(°), 升交点黄经(°), 轨道周期(天)]
//以太阳为中心，所以太阳无需轨道数据
var trackGeo = [
    [0,          0,     0,     0],
    [57910000,   7,     47.9,  87.969],
    [108200000,  3.394, 76.3,  224.7],
    [149600000,  0,     0,     365.256],
    [227940000,  1.850, 49.2,  686.98],
    [778330000,  1.308, 100,   4328.9],
    [1427000000, 2.488, 113.3, 10752.9],
    [2871000000, 0.774, 73.8,  30660],
    [4497000000, 1.774, 131.3, 60152]
];

/* 如果按照真实的比例建模，观赏性不太好。所以对模型按照不同的比例进行了缩小 */
// 太阳 + 八大行星半径 以及 轨道半径 的缩放倍数
//    var scale = [
//        [1/1000, 1],
//        [1/1000, 1/1000],
//        [1/1000, 1/1000],
//        [1/1000, 1/1000],
//        [1/1000, 1/1000],
//        [1/1000, 1/1000],
//        [1/1000, 1/1000],
//        [1/1000, 1/1000],
//        [1/1000, 1/1000],
//        [1/1000, 1/1000]
//    ];
var scale = [
    [1/500, 1],
    [1/25, 1/30000],
    [1/25, 1/30000],
    [1/25, 1/30000],
    [1/25, 1/30000],
    [1/150, 1/80000],
    [1/150, 1/100000],
    [1/100, 1/100000],
    [1/100, 1/100000]
];

//2000年1月1日12时八大行星的日心经度
var NASA = [
    0,
    252.25084,
    181.97973,
    100.46435,
    355.45332,
    34.404038,
    49.94432,
    313.23218,
    304.8803
]


//自转、公转的播放速度
var apeed = 0.03;

/* 开始建模 */
var eCanvas3d = document.getElementById("canvas3d"),
    width = eCanvas3d.clientWidth,
    height = eCanvas3d.clientHeight;

window.onload = init;

var scene, renderer, camera
function init() {
    renderer = new THREE.WebGLRenderer({
        antialias:true
    });
    renderer.setSize(width,height);
    renderer.setClearColor(0x000000);
    eCanvas3d.appendChild( renderer.domElement );

    camera = new THREE.PerspectiveCamera(75, width/height, 1, 10000000);
    camera.position.set(20000, 20000, 20000);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);

    var controls = new THREE.OrbitControls(camera,renderer.domElement);
    controls.minDistance = 5000;    //相机最近距离
    controls.maxDistance = 1000000; //相机最远距离

    scene = new THREE.Scene();

    //坐标轴
    var axes = new THREE.AxesHelper(10000);
    //scene.add(axes);

    var loader = new THREE.TextureLoader();     //初始化纹理

    // 银河系背景
    var meshYHX = new THREE.Mesh(
        new THREE.SphereGeometry(5000000, 64, 64),
        new THREE.MeshBasicMaterial({
            color:0xffffff,
            map:loader.load('img/yhx2.jpg'),
            side: THREE.BackSide
        })
    );
    /*太阳系平面（黄道面）与银河系平面（银道面）不在同一平面内，也不互相平行。
    * 北黄极：赤经18h 0m 0.0s，赤纬+66° 33′ 38.6″(J2000的精确值)，位于天龙座的龙身包围之中。
    * 北银极：赤经12h 51m 26.282s，赤纬+27° 07′ 42.01″（2000.0历元），位于牧夫座大角星附近
    * */
    // 我们以太阳为中心，改变银河系背景的角度
    meshYHX.rotation.y = 180*Math.PI/180;//应为贴图的位置是反的，所以掉转180度
    meshYHX.rotation.x = 66.33*Math.PI/180;
    meshYHX.rotation.z = -27.07*Math.PI/180;

    scene.add(meshYHX);

    var planetObj = [];     //存放行星模型，以便修改属性

    //太阳模型
    planetObj[0] = [];
    planetObj[0][0] = {};

    planetObj[0][0] = new THREE.Mesh(
        new THREE.SphereGeometry(planetGeo[0][0]*scale[0][0], 32, 32),
        new THREE.MeshBasicMaterial({
            color:0xffffff,
            map:loader.load('img/0.jpg'),
        })
    );
    planetObj[0][0].rotation.x = planetGeo[0][1]*Math.PI/180;         //赤道倾角
    scene.add(planetObj[0][0]);


    //建立 八大行星 模型
    var obj, mesh, track
    for (var i = 1; i < 9; i++) {
        //创建一个 空的 3d 对象，用来放置 星体 和 轨道，使其成为一个整体, 这样才能设置升交点黄经
        obj = new THREE.Object3D();
        obj.rotation.x = -90*Math.PI/180;
        //建立行星的网格模型
        mesh = new THREE.Mesh(
            // 创建行星
            new THREE.SphereGeometry(planetGeo[i][0]*scale[i][0], 32, 32),
            // 添加纹理
            new THREE.MeshPhongMaterial({
                color:0xffffff,
                map:loader.load('img/'+(i)+'.jpg')
            })
        );
        // 默认模型是横向的，需要先旋转90度摆正
        mesh.rotation.x = 90*Math.PI/180;
        // 赤道倾角
        mesh.rotation.z = planetGeo[i][1]*Math.PI/180;
        // 与太阳的距离
        mesh.position.x = trackGeo[i][0]*scale[i][1];

        // 建立轨道模型
        track = new THREE.Line(
            /* 将轨道的长度设置为0 可以隐藏了轨道 */
            arcLineGeometry( trackGeo[i][0]*scale[i][1], 120, 0*Math.PI/180, 360*Math.PI/180),
            new THREE.LineBasicMaterial({
                color:0x999999,
            })
        );
        track.add(mesh);    // 轨道对象 包含 行星
        obj.add(track);

        //设置轨道倾角
        track.rotation.x =  -trackGeo[i][1] *Math.PI/180;

        //设置 升交点黄经
        obj.rotation.z = trackGeo[i][2]*Math.PI/180;

        //设置轨道的升交点黄经会改变行星的日心经度，所以需要将轨道复位
        track.rotation.z = -trackGeo[i][2]*Math.PI/180;

        //将行星的日心经度设为 2000年1月1日12时八大行星的日心经度
        track.rotation.z = NASA[i]*Math.PI/180;

        scene.add(obj);
        planetObj[i] = [];

        planetObj[i][0] = obj;
        planetObj[i][1] = track;
        planetObj[i][2] = mesh;
    }


    /*加入行星的卫星
    *
    * --很难在网上找到卫星的整体数据，目前只将 月球 建模
    * --其它的行星， 如 彗星 以后再加
    * --小行星带。。。估计不好建模
    * */

    //3 地球有一个卫星,月球
    var wxObj = new THREE.Object3D();
    var wxMesh = new THREE.Mesh(
        new THREE.SphereGeometry(1738*(1/25), 32, 32),
        new THREE.MeshPhongMaterial({
            color: 0xffffff,
            map: loader.load('img/3-1.jpg')
        })
    );
    wxMesh.position.x = 384403*(1/600);
    wxObj.add(wxMesh);
    planetObj[3][2].add(wxObj);


    //土星环
    var ring6 = new THREE.Mesh(
        new THREE.RingGeometry(66900/3*scale[6][0], 483000/3*scale[6][0], 32, 20, 0, 2*Math.PI),
        new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
            map: loader.load('img/6-01.png'),
            side: THREE.DoubleSide
        })
    );
    ring6.rotation.x = 90*Math.PI/180;

    planetObj[6][2].add(ring6);

    //天王星环，这个星环是我自己画的，不是真实图形
    var ring7 = new THREE.Mesh(
        new THREE.RingGeometry(26840*scale[7][0], 103000*scale[7][0], 32, 20, 0, 2*Math.PI),
        new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
            map: loader.load('img/7-0.png'),
            side: THREE.DoubleSide
        })
    );
    ring7.rotation.x = 90*Math.PI/180;

    planetObj[7][2].add(ring7);


    //光源
    var light = new THREE.PointLight(0xFFF2B3);
    light.position.set( 60, 100, 60 );
    light.intensity = 1;
    light.distance = 100000;
    light.angle = Math.PI/3;
    scene.add(light);
    var amLight = new THREE.AmbientLight(0x666666);
    scene.add(amLight);


    // 动画
    animate()
    function animate() {
        requestAnimationFrame(animate);
        // 银河旋转，可以当成是太阳公转，只是效果，没有实际作用
        meshYHX.rotateY(0.0001);

        //太阳自转
        planetObj[0][0].rotateY( (1/planetGeo[0][2])*apeed);
        for (var n = 1; n < planetObj.length; n++) {
            // 公转
            planetObj[n][1].rotateZ( (1/trackGeo[n][3])*apeed);
            // 自转
            planetObj[n][2].rotateY( (1/planetGeo[n][2])*apeed);
        }
        renderer.render(scene, camera);
    }

    //加减速播放
    var ctrl = document.querySelector('.control'),
        btnUP = document.getElementById('speedUp'),
        btnDown = document.getElementById('shiftDown'),
        btnHide = document.getElementById('hide');

    ctrl.onmouseenter = function () {
        this.className = 'control hide';
    }

    var timer = null;
    btnUP.onmousedown = function () {
        apeed += 0.005;
        timer = setInterval(function () {
            apeed += 0.005;
            apeed = Math.min(apeed, 10);
        }, 20);
    }
    btnUP.onmouseup = function () {
        clearInterval(timer);
    }

    btnDown.onmousedown = function () {
        apeed -= 0.005;
        timer = setInterval(function () {
            apeed -= 0.005;
            apeed = Math.max(apeed, 0.001);
        }, 20);
    }
    btnDown.onmouseup = function () {
        clearInterval(timer)
    }

    //隐藏轨道
    btnHide.onclick = function () {
        this.innerText = this.innerText == 'hide'? 'show':'hide';
        for (var h = 1; h < planetObj.length; h++) {
            planetObj[h][1].isLine = !planetObj[h][1].isLine;
        }
    }
}


//three.js 画空心的圆圈 封装 函数
function arcLineGeometry(radius, segments, thetaStart, thetaLength) {
    radius = radius || 20;
    segments = segments || 8; if (segments < 3) segments = 3;
    thetaStart = thetaStart || 0;
    thetaLength = thetaLength || Math.PI*2;

    var geometry = new THREE.Geometry();

    var pii = (thetaLength-thetaStart)/segments;

    for (var i = 0; i < segments+1; i++) {
        var p = new THREE.Vector3(
            radius*Math.sin(thetaStart + pii*i ),
            radius*Math.cos(thetaStart + pii*i ),
            0
        );
        geometry.vertices.push(p);
    }
    return geometry;
}