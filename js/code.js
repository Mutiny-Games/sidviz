var canvas = document.querySelector("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var ctx = canvas.getContext("2d");
//jsSID.ReSID.const.RINGSIZE = 1024 * 4;
var player = null;
var settings = { 
	quality: jsSID.quality.best, //low,medium,best
	method: jsSID.ReSID.sampling_method.SAMPLE_FAST, //SAMPLE_FAST, SAMPLE_RESAMPLE_FAST, SAMPLE_INTERPOLATE, SAMPLE_RESAMPLE_INTERPOLATE
	model: localStorage.getItem("model") || jsSID.chip.model.MOS8580,
	clock: jsSID.chip.clock.PAL //NTSC
};

var sidrender = new SIDRender( canvas );
sidrender.onEvent = function(action,param, e)
{
	if(action == "playsong")
		sidrender.check_hq = true; // JCH: Check persistent HQ mode
		loadSong(param);
}

// var sids = [
// 	"data/DRAX/Black_Magic.sid",
// 	"data/DRAX/Camerock.sid",
// 	"data/DRAX/Capripholian_Waltz.sid",
// 	"data/DRAX/Crispy_Crushing_Crackers.sid",
// 	"data/DRAX/Deathblow.sid",
// 	"data/DRAX/Dirt.sid",
// 	"data/DRAX/KickAssembler_Easteregg.sid",
// 	"data/DRAX/Lady_Arabica.sid",
// 	"data/DRAX/Natural_Cause_of_Death.sid",
// 	"data/DRAX/Overlame.sid",
// 	"data/DRAX/Six-Pac_Man.sid",
// 	"data/DRAX/Star_Flake.sid",
// 	"data/DRAX/Tristesse.sid",
// 	"data/",
// 	"data/Jammer/5_A_Dub.sid",
// 	"data/Jammer/Amen_Bigbeat_Brother.sid",
// 	"data/Jammer/Caren_and_the_TT.sid",
// 	"data/Jammer/Euro_Spy.sid",
// 	"data/",
// 	"data/JCH/Aouw.sid",
// 	"data/JCH/Batman.sid",
// 	"data/JCH/Chordian.sid",
// 	"data/JCH/Electric_Toothbrush.sid",
// 	"data/JCH/George_Carl.sid",
// 	"data/JCH/Michelle.sid",
// 	"data/",
// 	"data/Jozz/Deel_1.sid",
// 	"data/Jozz/DMC_Demo_IV_1.sid",
// 	"data/Jozz/Fruitbank.sid",
// 	"data/Jozz/Namnam_Special.sid",
// 	"data/Jozz/Shape.sid",
// 	"data/",
// 	"data/JT/Hawkeye.sid",
// 	"data/JT/RoboCop_3.sid",
// 	"data/",
// 	"data/Laxity/Crosswords.sid",
// 	"data/Laxity/DNA_Warrior.sid",
// 	"data/Laxity/Mikuk.sid",
// 	"data/Laxity/Squamp.sid",
// 	"data/Laxity/Stormlord_II.sid",
// 	"data/",
// 	"data/Linus/64_Forever.sid",
// 	"data/Linus/Datalife_Verbatim.sid",
// 	"data/Linus/Enter_the_Ninja.sid",
// 	"data/Linus/Forbidden_Aztec.sid",
// 	"data/",
// 	"data/LMan/808_Love.sid",
// 	"data/LMan/Boombox_Alley.sid",
// ];

var sids = [
	"https://hvsc.csdb.dk/MUSICIANS/H/Hubbard_Rob/Bangkok_Knights.sid"
];
sidrender.setPlaylist(sids);

// JCH: Run tune URL from hash parameter if specified
if (window.location.hash != "")
	var url = window.location.hash.substr(1);
else
	var url = sids[0];

var started = false;
document.body.addEventListener("click",function(){
	if(started)
		return;
	var script = document.createElement("script");
	script.src = "js/libs/pico.dev.js";
	document.head.appendChild(script);
	script.onload = function(){
		loadSong( url );
		started = true;
	}
});

//render
function loop()
{
	requestAnimationFrame( loop );
	if(player && 1)
		sidrender.render( player.synth, player );
}

loop();


// audio
function loadSong( url, filename )
{
	if(url.substr(0,5) == "http:" || url.substr(0,6) == "https:")
		url = "http://chordian.net/sidviz/proxy.php?url=" + url;

	if(!filename)
		filename = url;

	var ext = getExtension( filename );

	sidrender.url = url; // JCH: Added to support proper stopping of a SID tune

	if( ext == "sid" )
	{
		player = new jsSID.SIDPlayer(settings);
		Stream.loadRemoteFile( url ,  function(data) {
			player.loadFileFromData(data);
			player.play();
		});
	}
	else if( ext == "dmp" )
	{
		player = new jsSID.DMPPlayer(settings);
		Stream.loadRemoteFile(url,  function(data) {
			player.loadFileFromData(data);
			player.play();
		});
	}
	else
		console.error("Unknown format, only SID and DMP are supported.");

	if(player && settings.method)
		player.synth.sampling = settings.method;

	if(player)
	{
		this.player.model = this.player.synth.model = localStorage.getItem("model") || jsSID.chip.model.MOS8580;
		this.player.synth.set_chip_model(this.player.model);
	}
}

// DRAG FILES

// Optional.   Show the copy icon when dragging over.  Seems to only work for chrome.
document.addEventListener('dragover', function(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
});

// Get file data on drop
document.addEventListener('drop', function(e) {
    e.stopPropagation();
    e.preventDefault();
    var files = e.dataTransfer.files; // Array of all files
    if(files.length)
	{
		var url = URL.createObjectURL(files[0]);
		loadSong( url, files[0].name );
    }

	var url = e.dataTransfer.getData("text/uri-list");
	if(url)
		loadSong( url );
});

function getExtension( url )
{
	var index = url.lastIndexOf(".");
	if(index != -1)
		return url.substr(index+1).toLowerCase();
	return "";
}


//MIDI

var midi = new MIDIInterface(function(){
	this.openInputPort( 0, on_midi_message );
})

function CONTROL( gate, waveform, ring )
{
	var control = gate ? 0x1 : 0x0; //gate
	if(waveform)
		control |= (waveform << 4) & 0xF0; //waveform
	if(ring)
		control |= 0x04; //ring mod
	return control;
}

var pitch = 0;
var bending = 0;
var delay = 200;

function on_midi_message(e,m)
{
	console.log(m);
	var synth = player.synth;

	var waveform = 0x4;
	var waveform2 = 0x1;

	if( m.cmd == MIDIEvent.NOTEON)
	{
		//gate, waveform, ring
		//var control = CONTROL( false, waveform, false );
		//synth.poke( 0x04, control, true); 
		var control = CONTROL( true, waveform, false );
		synth.poke( 0x04, control, true); 

		//freq
		pitch = m.getPitch() * 4;
		var freq = (pitch + bending)|0;
		synth.poke( 0x0, freq & 0x00FF, true); //FC LOW
		synth.poke( 0x1, (freq>>8) & 0x00FF, true); //FC HIGH

		var control = CONTROL( true, waveform2, false );
		synth.poke( 0x0b, control, true); 

		//freq
		pitch = m.getPitch() * 4;
		var freq = (pitch + bending)|0;
		synth.poke( 0x7, freq & 0x00FF, true); //FC LOW
		synth.poke( 0x8, (freq>>8) & 0x00FF, true); //FC HIGH
	}
	else if( m.cmd == MIDIEvent.NOTEOFF)
	{
		var control = CONTROL( false, waveform, false );
		synth.poke( 0x4, control, true); //control

		var control = CONTROL( false, waveform2, false );
		synth.poke( 0xb, control, true); //control
	}
	else if( m.cmd == MIDIEvent.CONTROLLERCHANGE)
	{
		if( m.data[1] == 1 ) //FILTER FC
		{
			var fc = m.data[2] * 300;
			synth.poke( 0x15, fc & 0x00FF, true); //FC LOW
			synth.poke( 0x16, (fc>>8) & 0x00FF, true); //FC HIGH
		}
		else if( m.data[1] == 5 ) //PW
		{
			var pw = m.data[2] * 16;
			synth.poke( 0x2, pw & 0x00FF, true); //PW LOW
			synth.poke( 0x3, (pw>>8) & 0x00FF, true); //PW HIGH
		}
	}
	else if( m.cmd == MIDIEvent.PITCHBEND)
	{
		bending = m.getPitchBend() * (1/12);
		var freq = (pitch + bending)|0;
		synth.poke( 0x0, freq & 0x00FF, true); //FC LOW
		synth.poke( 0x1, (freq>>8) & 0x00FF, true); //FC HIGH
	}
}