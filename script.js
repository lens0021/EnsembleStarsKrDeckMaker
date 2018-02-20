var log = function( msg ) {
	var showLog = true;
	if ( showLog ) console.log( msg );
}

const abilityFromNumber = [ 'dance', 'vocal', 'performance' ];
const typeFromNumber = abilityFromNumber;
const typeToNumber = { dance: 0, vocal: 1, performance: 2 };
const maxCardNumber = 200;

const idols = [
	'테토라', '하지메', '토모야', '히나타', '미도리',
	'토리', '시노부', '유우타', '미츠루', '츠카사',
	'스바루', '호쿠토', '마코토', '소마', '아도니스',
	'코가', '리츠', '마오', '유즈루', '아라시',
	'케이토', '에이치', '카오루', '이즈미', '치아키',
	'쿠로', '와타루', '카나타', '레이', '나즈나'
];

const minCardNum = 5;

var data = undefined;

var newData = function() {
	var data = new Uint32Array(2+4*maxCardNumber);
	data[1] = 5;
	for ( var i=2; i < 1+data[1]*4; i+=4 )
		data[i] = ~0;
	return data;
}

var getData = function( request ) {
	if ( request === 'version' )
		return data[0] >>> 24;
	else if ( request === 'type' )
		return typeFromNumber[(data[0] >>> 20) & 15];
	else if ( request === 'activeUnitNum' )
		return ((data[0] >>> 16 ) & 15)+1;
	else if ( request === 'cardNum' ) {
		return data[1];
	}
	else {
		if ( data[2+request*4] == ~0 )
			return undefined;
		return {
			idol: idols[data[2+request*4]],
			dance: data[2+request*4+1],
			vocal: data[2+request*4+2],
			performance: data[2+request*4+3]
		};
	}
}

var setData = function( type, val ) {
	if ( type === 'version' )
		data[0] = (data[0] & ~(255<<24)) + (val<<24);
	else if ( type === 'type' )
		data[0] = (data[0] & ~(15<<20)) + (typeToNumber[val]<<20);
	else if (type === 'activeUnitNum' )
		data[0] = (data[0] & ~(15<<16)) + ((val-1)<<16);
	else if( typeof(type) == 'number' ){
		if ( val['idol'] != undefined )
			data[2+(type*4)] = val['idol'];
		if ( val['dance'] != undefined )
			data[2+(type*4)+1] = val['dance'];
		if ( val['vocal'] != undefined )
			data[2+(type*4)+2] = val['vocal'];
		if ( val['performance'] != undefined )
			data[2+(type*4)+3] = val['performance'];
	}

	onChangedData();
}

var getHexStringData = function() {
	var str = '';
	for ( var i=0; i < 2+data[1]*4; i++ ) {
		str += ('00000000' + data[i].toString(16)).substr(-8, 8);
	}

	return str;
}

var convertHexStringToData = function( str ) {
	var data = new Uint32Array(2+4*maxCardNumber);
	var j=0;
	for( var i=0; i < str.length; i+=8 ) {
		data[j++] = parseInt( str.substring(i, i+8), 16 );
	}

	return data;
}

var writeCookie = function () {
	log('쿠키를 씁니다.');
	var hexData = getHexStringData();
	var d = new Date();
	var exdays = 30;
	d.setTime(d.getTime() + (exdays*24*60*60*1000));

	var cookie = 'data='+hexData+';expires=' + d.toUTCString() + ';';

	log('다음과 같은 쿠키를 씁니다: '+cookie);
	document.cookie = cookie;
	log('쿠키가 다음과 같이 쓰였습니다: '+document.cookie);
}

var removeCardDataAt = function( i ) {
	data[1]--;
	for ( var mid = 2+i*4; mid <= 2+(data[1]+1)*4; mid++ ) {
		data[mid] = data[mid+4];
	}
	onChangedData();
}

var addCardData = function( card ) {
	log('카드 추가(카드 수:'+data[1]+')');
	if ( card === undefined ) {
		log(data[1]);
		data[2 + data[1]*4] = ~0;
		log(data);
	} else {
		data[2 + data[1]*4] = card['idol'];
		data[2 + data[1]*4+1] = card['dance'];
		data[2 + data[1]*4+2] = card['vocal'];
		data[2 + data[1]*4+3] = card['performance'];
	}
	data[1]++;
	onChangedData();
}

var $cardProto;

var pickerIndex = undefined;
var openIdolPicker = function( index ) {
	pickerIndex = index;
	$('.overlay').toggle( true );
};

var initializeCard = function( $card ) {
	var index = $card.prevAll().length;
	log(index+'번 카드를 초기화합니다.');

	$card.find('.remove-card').click( function( event ) {
		event.preventDefault();
		if ( getData('cardNum') <= 5 )
			return;

		log(index+'번 카드를 없앱니다.');
		removeCardDataAt( index );
	} );

	$card.find('.card-thumb').click( function( event ) {
		event.preventDefault();

		log(index+'를 위한 picker를 띄웁니다.');
		openIdolPicker( index );
	} );

	$card.find("input[type='number']").on( "click", function(e) {
	   $(this).select();
	});

	$card.find("input[type='number']").keydown(function (e) {
		if (e.which === 13) {
			 var index = $("input[type='number']").index(this) + 1;
			 if ( index <= $("input[type='number']").length - 1 )
			 	$("input[type='number']").eq(index).focus().select();
			 else {
			 	addCardData();
			 	$("input[type='number']").eq(index).focus().select();
			 }
		 }
	 });
	var cnt=0;
	$card.find("input[type='number']").on( 'input', function(e) {
		var type = abilityFromNumber[$(this).prevAll().length];
		var card = {};
		card[type] = $(this).val();
		setData( index, card );
	});
};

var onChangedData = function ( needToWriteCookie = true ) {
	// 계산
	// 쿠키 쓰기
	if ( needToWriteCookie )
		writeCookie();
	
	// 디자인 변경
	// 속성
	$('.deck')
		.removeClass( 'dance' )
		.removeClass( 'vocal' )
		.removeClass( 'performance' )
		.addClass( getData('type') );
	// 유닛
	$('#unit2-switch').toggleClass( "active", getData('activeUnitNum') >= 2 );
	$('#unit3-switch').toggleClass( "active", getData('activeUnitNum') >= 3 );

	log( '카드가 ' + getData( 'cardNum' ) + '개 있습니다.');
	var ct = 0;
	while ( getData('cardNum') < $('.input .card').length ) {
		$('.input .card:last').remove();
		if ( ct++ > maxCardNumber*1.5 ) break;
	}
	ct = 0;
	while ( getData('cardNum') > $('.input .card').length ) {
		var clone = $cardProto.clone().insertBefore( $('.add-card') );
		initializeCard( clone );
		if ( ct++ > maxCardNumber*1.5 ) break;
	}

	$('.input .card').each( function( i ) {
		$(this).find('.card-thumb').html( getData(i)['idol'] === undefined ? '' : getData(i)['idol'] );
		$(this).find('.card-dance').attr('value', getData(i)['dance'])
		$(this).find('.card-vocal').attr('value', getData(i)['vocal'])
		$(this).find('.card-performance').attr('value', getData(i)['performance'])
	} );

	$('.input .card .remove-card').toggleClass( "disabled", getData('cardNum') <= minCardNum );
};

$( document ).ready( function() {
	$cardProto = $('.input .card').clone();
	initializeCard($('.input .card'));

	log( '쿠키가 있는지 확인합니다.' )
	var cookie = document.cookie;
	// cookie = 'data=002200000000001d0000000b00001b1400000f69000054b300000017000023cb0000263d0000548b0000000c0000249c000016ad00004ede00000012000011b0000017b900004164000000060000177f00001c50000039cc00000011000018af00001f54000034c40000001500000be200001442000032c60000001c0000134e00001c5b00002f0c0000000200002c5d0000445f0000291e0000000e00003c8f00001ff20000268b00000001000028390000173a000023860000000a000015c600002d56000022b6000000170000249f00000d9e00001f030000000900002fbb00001a8700001e250000001800002bc0000019d000001bef0000000f0000323a0000120800001a540000001c0000208500003fb000001a4a00000003000023fb00001214000019c90000000d00000a6700000ba6000019890000000400001b1f00002f2200001967000000030000231e0000273b000017dc0000001c0000221d000035f9000016970000000c000019e50000194d000016100000000f000015c2000023aa0000155e0000000f0000096900000992000016b00000001000002d9e0000139d000014960000000200002f260000175a000014460000000d0000087700000c6e000013ef0000001400000c370000098300001353';
	log( '쿠키는 다음과 같습니다: '+cookie);
	var dataStr = cookie.match(/data=([^;]+)/);
	if ( dataStr != null ) {
		log( '쿠키에서 data를 가져왔습니다: '+dataStr[1]);
		data = convertHexStringToData( dataStr[1] );
		onChangedData( false );
	}
	else {
		log( '쿠키에서 data를 가져오는데 실패하였습니다.');
		data = newData();
		onChangedData();
	}
	var ct =0;

	for ( var i in idols ) {
		var $idol = $('<li></li>').addClass( 'idol-picker-idol' ),
		$anchor = $('<a></a>').attr( 'href','#' ).click( function( e ) {
			var index = $(this).parent().prevAll().length;
			event.preventDefault();
			setData( pickerIndex, { idol: index } );
			$('.overlay').toggle( false );
		} ).html(idols[i]);
		$idol.append( $anchor );
		$idol.appendTo($('.idolPicker ol'));
		if(ct++>50) break;
	}

	$('.switch').click( function(event) {
		event.preventDefault();
		index = $(this).parent().parent().prevAll().length;

		setData( 'activeUnitNum', index + ($(this).hasClass('active')?0:1) );
	} );

	$('#deck-option-dance a').click( function(event) {
		event.preventDefault();
		setData( 'type', 'dance' );
	} );

	$('#deck-option-vocal a').click( function(event) {
		event.preventDefault();
		setData( 'type', 'vocal' );
	} );

	$('#deck-option-performance a').click( function(event) {
		event.preventDefault();
		setData( 'type', 'performance' );
	} );

	$('.deck-total-ability a').click( function( event ) {
		event.preventDefault();
		var crtType = getData( 'type' );
		if ( crtType == 'dance' )
			setData( 'type', 'vocal' );
		if ( crtType == 'vocal' )
			setData( 'type', 'performance' );
		else if ( crtType == 'performance' )
			setData( 'type', 'dance' );
	});

	$('.add-card a').click( function(event) {
		event.preventDefault();
		addCardData();
	});

	$('.overlay').click( function(event) {
		$(this).toggle( false );
	});

	$('#import').click( function(event) {
		event.preventDefault();

		var str = window.prompt("「내보내기」한 텍스트를 붙여넣어 주세요.","");
		if ( str != null &&  str != '' ){
			data = convertHexStringToData(str);
			onChangedData( false );
		}
	});

	$('#export').click( function(event) {
		event.preventDefault();

		prompt("다음을 「복사」해서 저장하세요.", getHexStringData());
	});

	$('.deck').toggleClass('loading');
} );