(function ( document, window, undefined ) {

var commands = {};
var params = {};
var tags = {};
var structures = {}
var blocks = [];
var items = [];
var entities = [];
var selectors = [];

var groupPrefix = 0;

function quote ( value )
{
	return '"' + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'") + '"'
}

function mergeObjects ( )
{
	var argument, object = {};
	
	for ( var i = 0; i < arguments.length; i++ )
	{
		argument = arguments[i];
		
		if ( typeof argument == 'object' )
		{
			for ( var name in argument )
			{
				if ( argument.hasOwnProperty ( name ) && !object.hasOwnProperty ( name ) )
					object[name] = argument[name]
			}
		}
	}
	
	return object;
}

function onAddClick ( e )
{
	e = e || window.event;
	var target = e.target || e.srcElement;

	if ( e.preventDefault )
		e.preventDefault ( );

	this.addItem ( );

	return false;
}

function onRemoveClick ( e, parent )
{
	e = e || window.event;
	var target = e.target || e.srcElement;

	if ( e.preventDefault )
		e.preventDefault ( );

	var i;

	if ( this.tags )
	{
		for ( i = 0; i < this.tags.length; i++ )
		{
			if ( this.tags[i].container == parent )
			{
				this.tags.splice ( i, 1 )
				parent.parentNode.removeChild ( parent );
				break;
			}
		}
	}

	if ( this.customs )
	{
		for ( i = 0; i < this.customs.length; i++ )
		{
			if ( this.customs[i].container == parent )
			{
				this.customs.splice ( i, 1 )
				parent.parentNode.removeChild ( parent );
				break;
			}
		}
	}

	if ( this.paramsOrdered )
	{
		for ( i = 0; i < this.paramsOrdered.length; i++ )
		{
			if ( this.paramsOrdered[i].container == parent )
			{
				this.paramsOrdered.splice ( i, 1 )
				parent.parentNode.removeChild ( parent );
				break;
			}
		}
	}

	if ( this.params )
	{
		for ( i = 0; i < this.params.length; i++ )
		{
			if ( this.params[i].container == parent )
			{
				this.params.splice ( i, 1 )
				parent.parentNode.removeChild ( parent );
				break;
			}
		}
	}

	updateCommand ( );

	return false;
}

function CommandSelector ( container, text, from )
{
	this.command = null;
	this.reader = container;
	this.text = text;

	this.createHTML ( container );

	if ( from && from.command )
		this.command = from.command;

	this.updateCommand ( this.selector.value );
}

CommandSelector.prototype.onSelectorChange = function ( e )
{
	e = e || window.event;
	var target = e.target || e.srcElement;

	var command = target.value;

	if ( !command )
		return;

	var container = target.parentNode;

	this.updateCommand ( command );

	updateCommand ( );
}

CommandSelector.prototype.update = function ( )
{
	this.command.update ( );
}

CommandSelector.prototype.updateCommand = function ( command )
{
	var options = this.options;

	options.innerHTML = '';

	this.selector.value = command;

	if ( typeof commands[command] == 'function' )
		this.command = new commands[command] ( options, this.command );
	else
		this.command = new commands['Generic'] ( options, command, this.command );
}

CommandSelector.prototype.createHTML = function ( container )
{
	container.className += ' mc-command';

	var selector = document.createElement ( 'select' );
	selector.className = 'mc-command-selector';
	selector.addEventListener ( 'change', ( function ( commandSelector ) { return function ( e ) { commandSelector.onSelectorChange ( e ) } } ) ( this ) );
	container.appendChild ( selector );

	for ( var command in commands )
	{
		var option = document.createElement ( 'option' );
		option.appendChild ( document.createTextNode ( command ) );
		selector.appendChild ( option );
	}

	var options = document.createElement ( 'table' );
	options.className = 'mc-command-options';
	container.appendChild ( options );

	this.selector = selector;
	this.options = options;
}

CommandSelector.prototype.toString = function ( )
{
	return this.command.toString ( );
}

function Command ( )
{
}

Command.prototype.init = function ( container, name, description, options )
{
	var defaultOptions = {};
	
	options = mergeObjects ( options, defaultOptions );
	
	this.container = container
	
	this.name = name
	this.description = description
	
	this.params = {};
	this.paramsOrdered = [];
	
	this.options = options;
}

Command.prototype.updateLoop = function ( )
{
	var nextHasValue = false;
	var param;
	
	for ( var i = this.paramsOrdered.length - 1; i >= 0; i-- )
	{
		param = this.paramsOrdered[i]

		if ( param.group !== undefined && param.groupIndex !== undefined && !this.groupRadioSelected ( param.group, param.groupIndex ) )
		{
			if ( param.value.setError )
				param.value.setError ( false );
			continue;
		}

		if ( param.container.style.display === '' || param.ignoreIfHidden === false )
			param.value.update ( param.neverRequireValue ? false : nextHasValue );
		else if ( param.value.setError )
			param.value.setError ( false );
		
		if ( !param.ignoreValue && ( param.container.style.display === '' || param.ignoreIfHidden === false ))
		{
			value = param.value.toString ( nextHasValue );
			if ( value !== '' )
			{
				nextHasValue = true;
			}
		}
	}
}

Command.prototype.update = function ( )
{
	this.updateLoop ( );
}

Command.prototype.toString = function ( )
{
	var values = [];
	var param;

	var nextHasValue = false;
	for ( var i = this.paramsOrdered.length - 1; i >= 0; i-- )
	{
		param = this.paramsOrdered[i]

		if ( param.group !== undefined && param.groupIndex !== undefined && !this.groupRadioSelected ( param.group, param.groupIndex ) )
			continue;
		
		if ( !param.ignoreValue && ( param.container.style.display === '' || param.ignoreIfHidden === false ))
		{
			value = param.value.toString ( param.neverRequireValue ? false : nextHasValue );
			if ( value !== '' )
			{
				nextHasValue = true;
				values.unshift ( value );
			}
		}
	}

	var output = '/' + this.name;

	values = values.join ( ' ' );

	if ( values !== '' )
		output += ' ' + values;

	return output;
}

Command.prototype.groupRadioSelected = function ( name, index )
{
	var param;
	
	for ( var i = 0; i < this.paramsOrdered.length; i++ )
	{
		param = this.paramsOrdered[i];
		if ( param.group === name && param.groupIndex === index && param.groupRadiobox )
			return param.groupRadiobox.checked;
	}
	
	return false;
}

Command.prototype.groupExists = function ( name )
{
	var param;
	
	for ( var i = 0; i < this.paramsOrdered.length; i++ )
	{
		if ( this.paramsOrdered[i].group === name )
			return true;
	}
	
	return false;
}

Command.prototype.groupRadioExists = function ( name, index )
{
	var param;
	
	for ( var i = 0; i < this.paramsOrdered.length; i++ )
	{
		param = this.paramsOrdered[i];
		if ( param.group === name && param.groupIndex === index )
			return true;
	}
	
	return false;
}

Command.prototype.groupRadioFirst = function ( name, index )
{
	var param;
	
	for ( var i = 0; i < this.paramsOrdered.length; i++ )
	{
		param = this.paramsOrdered[i];
		if ( param.group === name && param.groupIndex === index )
			return param.groupRadiobox;
	}
	
	return null;
}

Command.prototype.createParam = function ( container, name, type, from, options )
{
	var defaultOptions = {
		showName: true,
		nameBorder: true,
		optional: false,
		ignoreValue: false,
		ignoreIfHidden: true,
		neverRequireValue: false
	}
	
	var fragment = document.createDocumentFragment ( );
	
	defaultOptions = mergeObjects ( this.defaultParamOptions, defaultOptions )
	
	options = mergeObjects ( options || {}, defaultOptions );
	
	//options = options || {};
	if ( options.completelyOptional )
		options.optional = options.neverRequireValue = true

	/* Param data */
	
	var fromValue = null;
	var fromValueIndex = 0;
	if ( from )
	{
		var param, paramIndex = 0;
		for ( var i = 0; i < this.paramsOrdered.length; i++ )
		{
			param = this.paramsOrdered[i];
			
			if ( typeof name == 'string' && param.name === name )
			{
				paramIndex++
			}
			else if ( typeof name == 'object' && typeof param.name == 'object' && param.name.prefix === name.prefix && param.name.suffix === name.suffix )
			{
				paramIndex++
			}
		}
		
		for ( var i = 0; i < from.length; i++ )
		{
			fromParam = from[i];
			
			if ( typeof name == 'string' && fromParam.name === name )
			{
				if ( fromValueIndex == paramIndex )
				{
					fromValue = fromParam
					break;
				}
				
				fromValueIndex++
			}
			else if ( typeof name == 'object' && typeof fromParam.name == 'object' && fromParam.name.prefix === name.prefix && fromParam.name.suffix === name.suffix )
			{
				if ( fromValueIndex == paramIndex )
				{
					fromValue = fromParam
					break;
				}
				
				fromValueIndex++
			}
		}
	}
	
	var row;
	
	if ( options.showName )
	{
		row = document.createElement ( 'tr' );

		/* Param title */
		
		var cell = document.createElement ( 'th' );
		
		if ( typeof name == 'object' )
		{
			var nameInput = document.createElement ( 'input' );
			nameInput.className = 'param-name';
			nameInput.value = name.defaultValue || fromValue && fromValue.name.input && fromValue.name.input.value || ''
			nameInput.addEventListener ( 'change', updateCommand );
			name.input = nameInput;
			
			if ( options.nameBorder )
				cell.appendChild ( document.createTextNode ( options.optional ? '[' : '<' ) );
				
			if ( name.prefix )
				cell.appendChild ( document.createTextNode ( name.prefix ) );
			
			cell.appendChild ( nameInput );
			
			if ( name.suffix )
				cell.appendChild ( document.createTextNode ( name.suffix ) );
			
			if ( options.nameBorder )
				cell.appendChild ( document.createTextNode ( options.optional ? ']' : '>' ) );
		}
		else
			cell.appendChild ( document.createTextNode ( options.nameBorder ? ( options.optional ? '[' + name + ']' : '<' + name + '>' ) : name ) );
		
		row.appendChild ( cell );
	}
	
	/* data */

	if ( options.showName )
	{
		cell = document.createElement ( 'td' );
		row.appendChild ( cell );
		fragment.appendChild ( row );
	}
	else
	{
		cell = document.createElement ( 'div' );
		fragment.appendChild ( cell );
	}
	
	if ( options.group !== undefined && options.groupIndex !== undefined )
	{
		var radiobox = document.createElement ( 'input' )
		radiobox.type = 'radio'
		radiobox.name = ( options && options.groupPrefix || 'needs-a-prefix' ) + '-' + options.group
		radiobox.index = options.groupIndex
		radiobox.checked = !this.groupExists ( options.group )
		radiobox.style.visibility = ( this.groupRadioExists ( options.group, options.groupIndex ) ? 'hidden' : '' )
		radiobox.addEventListener ( 'change', ( function ( command ) { return function ( e ) { command.onGroupRadioboxChange ( e ) } } ) ( this ) );
		options.groupRadiobox = this.groupRadioFirst ( options.group, options.groupIndex ) || radiobox
		cell.appendChild ( radiobox )
	}
	
	if ( params[type] == null  )
		throw new Error ( 'Missing param function ' + type )
	else if ( typeof params[type] !== 'function' )
		throw new Error ( 'Invalid param function ' + type )
	
	//console.log ( 'Param' + type );
	var value = new params[type] ( cell, fromValue && fromValue.value, options );

	if ( options && options.remove )
	{
		var span = document.createElement ( 'span' );
		span.appendChild ( document.createTextNode ( 'Remove' ) );
		span.addEventListener ( 'click', ( function ( param, parent ) { return function ( e ) { param.onRemoveClick ( e, parent ) } } ) ( this, row ) );
		cell.appendChild ( span );
	}
	
	cell.addEventListener ( 'click', ( function ( param ) { return function () { param.selectGroup ( ) } } ) ( value ) );
	
	var param = {
		name: name,
		value: value,
		defaultValue: options.defaultValue,
		ignoreValue: options.ignoreValue,
		ignoreIfHidden: options.ignoreIfHidden,
		optional: options.optional,
		neverRequireValue: options.neverRequireValue,
		container: row || cell,
		group: options.group,
		groupIndex: options.groupIndex,
		groupRadiobox: options.groupRadiobox
	};

	if ( typeof name != 'object' && this.params[name] === undefined )
		this.params[name] = param
		
	this.paramsOrdered.push ( param );
	
	container.appendChild ( fragment );
}

Command.prototype.onGroupRadioboxChange = function ( e )
{
	updateCommand ( )
}

function GenericCommand ( container, name, from )
{
	this.init ( container, name, commands[name].description )

	from = from && from.paramsOrdered;

	var params = commands[name].params;

	for ( var i = 0; i < params.length; i++ )
	{
		var param = params[i];

		this.createParam ( container, param.name, param.type || 'Text', from, param.options );
	}
}

GenericCommand.prototype = new Command ( );

function CommandAchievement ( container, from )
{
	this.init ( container, 'achievement', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'give', 'Static', from, { defaultValue: 'give' }  );
	//this.createParam ( container, 'achievement or statistic', 'Achievement', from );
	this.createParam ( container, 'achievement or statistic', 'Select', from, { items: [{group:'Achievements'}].concat ( achievements, {group:'Statistics'}, statistics ), editable: true, custom: true } );
	this.createParam ( container, 'player', 'PlayerSelector', from, { optional: true } );
}

CommandAchievement.prototype = new Command ( );

function CommandClear ( container, from )
{
	this.init ( container, 'clear', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'player', 'PlayerSelector', from, { optional: true } );
	//this.createParam ( container, 'item metadata', 'Item', from, { optional: true, ignoreValue: true, stringIds: true } ); // New ParamItem, list of all items + custom
	this.createParam ( container, 'item metadata', 'Select', from, { optional: true, ignoreValue: true, stringIds: true, items: items, value: '{id} {data}', custom: true } );
	this.createParam ( container, 'item', 'Text', from, { optional: true, ignoreIfHidden: false } );
	this.createParam ( container, 'metadata', 'Number', from, { optional: true, ignoreIfHidden: false, defaultValue: 0, min: 0 } );
}

CommandClear.prototype = new Command ( );

CommandClear.prototype.update = function ( )
{
	if ( this.params['item metadata'].value.value !== '0' )
	{
		var itemMetadata = this.params['item metadata'].value.value.split ( ' ' );

		this.params.item.value.setValue ( itemMetadata[0] || '' );
		this.params.metadata.value.setValue ( itemMetadata[1] || '' );
	}

	if ( this.params['item metadata'].value.value === '0' )
	{
		this.params.item.container.style.display = '';
		this.params.metadata.container.style.display = '';
	}
	else
	{
		this.params.item.container.style.display = 'none';
		this.params.metadata.container.style.display = 'none';
	}

	this.updateLoop ( );
}

function CommandDebug ( container, from )
{
	this.init ( container, 'debug', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'start | stop', 'Select', from, { items: ['start', 'stop'] } );
}

CommandDebug.prototype = new Command ( );

function CommandDefaultGamemode ( container, from )
{
	this.init ( container, 'defaultgamemode', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'survival | creative | adventure', 'Select', from, { items: ['survival', 'creative', 'adventure'] } );
}

CommandDefaultGamemode.prototype = new Command ( );

function CommandDifficulty ( container, from )
{
	this.init ( container, 'difficulty', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'peaceful | easy | normal | hard', 'Select', from, { items: ['peaceful', 'easy', 'normal', 'hard'] } );
}

CommandDifficulty.prototype = new Command ( );

function CommandEffect ( container, from )
{
	this.init ( container, 'effect', '' )

	from = from && from.paramsOrdered;
	
	this.createParam ( container, 'player', 'PlayerSelector', from );
	//this.createParam ( container, 'effect', 'Potion', from );
	this.createParam ( container, 'effect', 'Select', from, { items: [{id: 'Clear'}].concat ( potions ) } );
	this.createParam ( container, 'seconds', 'Number', from, { optional: true, ignoreIfHidden: true, min:0, max:1000000, defaultValue: 30 } );
	this.createParam ( container, 'amplifier', 'Number', from, { optional: true, ignoreIfHidden: true, min:0, max:255, defaultValue: 0 } );
}

CommandEffect.prototype = new Command ( );

CommandEffect.prototype.update = function ( )
{
	this.updateLoop ( );

	if ( this.params.effect.value.value === 'Clear' )
	{
		this.params.seconds.container.style.display = 'none';
		this.params.amplifier.container.style.display = 'none';
	}
	else
	{
		this.params.seconds.container.style.display = '';
		this.params.amplifier.container.style.display = '';
	}
}
/*
CommandEffect.prototype.toString = function ( )
{
	var output = '/' + this.name;
	var value;

	if ( this.params.effect.value.value === '0' )
	{
		value = ' ' + this.params.player.value;
		if ( value != ' ' )
			output += value;

		output += ' clear';
	}
	else
	{
		for ( var param in this.params )
		{
			value = ' ' + this.params[param].value;
			if ( value != ' ' )
				output += value;
		}
	}

	return output;
}*/

function CommandEnchant ( container, from )
{
	this.init ( container, 'enchant', '' )
	
	from = from && from.paramsOrdered;

	this.createParam ( container, 'player', 'PlayerSelector', from );
	//this.createParam ( container, 'enchantment', 'Enchantment', from );
	this.createParam ( container, 'enchantment', 'Select', from, { items: enchantments } );
	this.createParam ( container, 'level', 'Number', from, { optional: true, min:1, max:5, defaultValue: 1 } );
}

CommandEnchant.prototype = new Command ( );

CommandEnchant.prototype.update = function ( )
{
	/*switch ( this.params.enchantment.value.value )
	{
		case '6':
		case '33':
		case '50':
		case '51':
			this.params.level.value.options.max = 1;
			this.params.level.value.input.max = 1;
		break;
		case '19':
		case '20':
		case '49':
			this.params.level.value.options.max = 2;
			this.params.level.value.input.max = 2;
		break;
		case '5':
		case '7':
		case '21':
		case '34':
		case '35':
		case '61':
		case '62':
			this.params.level.value.options.max = 3;
			this.params.level.value.input.max = 3;
		break;
		case '0':
		case '1':
		case '2':
		case '3':
		case '4':
			this.params.level.value.options.max = 4;
			this.params.level.value.input.max = 4;
		break;
		default:
			this.params.level.value.options.max = 5;
			this.params.level.value.input.max = 5;
	}*/
	
	var id = this.params.enchantment.value.value;
	
	for ( var i = 0; i < enchantments.length; i++ )
	{
		var enchantment = enchantments[i];
		
		if ( enchantment.id == id )
		{
			this.params.level.value.options.max = enchantment.maxLevel;
			this.params.level.value.input.max = enchantment.maxLevel;
			
			break;
		}
	}

	this.updateLoop ( );
}

function CommandGamemode ( container, from )
{
	this.init ( container, 'gamemode', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'survival | creative | adventure', 'Select', from, { items: ['survival', 'creative', 'adventure'] } );
	this.createParam ( container, 'player', 'PlayerSelector', from, { optional: true } );
}

CommandGamemode.prototype = new Command ( );

function CommandGameRule ( container, from )
{
	this.init ( container, 'gamerule', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'rulename', 'Select', from, { items: ['commandBlockOutput', 'doFireTick', 'doMobLoot', 'doMobSpawning', 'doTileDrops', 'keepInventory', 'mobGriefing', 'naturalRegeneration', 'doDaylightCycle'] } );
	//this.createParam ( container, 'true | false', 'Select', from, { items: ['true', 'false'] } );
	this.createParam ( container, 'true | false', 'Boolean', from );
}

CommandGameRule.prototype = new Command ( );

function CommandGive ( container, from )
{
	this.init ( container, 'give', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'player', 'PlayerSelector', from );
	//this.createParam ( container, 'item metadata', 'Item', from, { ignoreValue: true, stringIds: true } ); // New ParamItem, list of all items + custom
	this.createParam ( container, 'item metadata', 'Select', from, { ignoreValue: true, stringIds: true, items: items, value: '{id} {data}', custom: true } );
	this.createParam ( container, 'item', 'Number', from, { ignoreIfHidden: false, min: 1 } );
	this.createParam ( container, 'amount', 'Number', from, { optional: true, min: 0, max: 64, defaultValue: 1 } );
	this.createParam ( container, 'metadata', 'Number', from, { optional: true, ignoreIfHidden: false, defaultValue: 0, min: 0, max: 15 } );
	this.createParam ( container, 'dataTag', 'DataTag', from, { optional: true, type: 'Item' } );
}

CommandGive.prototype = new Command ( );

CommandGive.prototype.update = function ( )
{
	var selectValue = this.params['item metadata'].value.value.toString ( );
	
	if ( selectValue === '0' )
	{
		this.params.item.container.style.display = '';
		this.params.metadata.container.style.display = '';
	}
	else
	{
		var itemMetadata = selectValue.split ( ' ' );

		this.params.item.value.setValue ( itemMetadata[0] || '' );
		this.params.item.container.style.display = 'none';
		
		if ( itemMetadata[1] !== '*' )
		{
			this.params.metadata.value.setValue ( itemMetadata[1] || '' );
			this.params.metadata.container.style.display = 'none';
		}
		else
			this.params.metadata.container.style.display = '';
	}
	
	var itemId = this.params.item.value.value;
	var item;
	
	for ( var i = 0; i < items.length; i++ )
	{
		item = items[i];
		
		if ( item.id == itemId || item.stringId == itemId )
		{
			var structure = item.structure || 'Item'
			if ( structure != this.params.dataTag.value.type )
				this.params.dataTag.value.updateType ( structure )
			break
		}
	}

	this.updateLoop ( );
}

function CommandMe ( container, from )
{
	this.init ( container, 'me', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'actiontext', 'Text', from );
}

CommandMe.prototype = new Command ( );

function CommandPlaySound ( container, from )
{
	this.init ( container, 'playsound', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'sound id', 'Select', from, { ignoreValue: true, items: sounds, custom: true } );
	this.createParam ( container, 'sound', 'Text', from, { ignoreIfHidden: false } );
	this.createParam ( container, 'player', 'PlayerSelector', from );
	this.createParam ( container, 'x', 'Pos', from, { optional: true } );
	this.createParam ( container, 'y', 'Pos', from, { optional: true, height: true } );
	this.createParam ( container, 'z', 'Pos', from, { optional: true } );
	this.createParam ( container, 'volume', 'Number', from, { optional: true, min:0.0, isFloat:true, defaultValue: 1.0 } );
	this.createParam ( container, 'pitch', 'Number', from, { optional: true, min:0.0, max:2.0, isFloat:true, defaultValue: 1.0 } );
	this.createParam ( container, 'minimumVolume', 'Number', from, { optional: true, min:0.0, max:1.0, isFloat:true, defaultValue: 0.0 } );
}

CommandPlaySound.prototype = new Command ( );

CommandPlaySound.prototype.update = function ( )
{
	var selectValue = this.params['sound id'].value.value.toString ( );
	
	if ( selectValue === 'custom' )
		this.params.sound.container.style.display = '';
	else
	{
		this.params.sound.container.style.display = 'none';
		
		this.params.sound.value.setValue ( selectValue );
	}

	this.updateLoop ( );
}

function CommandSay ( container, from )
{
	this.init ( container, 'say', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'message', 'Text', from );
}

CommandSay.prototype = new Command ( );

function CommandScoreBoard ( container, from )
{
	this.init ( container, 'scoreboard', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'objectives | players | teams', 'Select', from, { items: ['objectives','players','teams'] } );
	this.createParam ( container, 'objectives', ParamScoreboardObjectives, from );
	this.createParam ( container, 'players', ParamScoreboardPlayers, from );
	this.createParam ( container, 'teams', ParamScoreboardTeams, from );
	/*this.createParam ( container, 'list | add | remove | setdisplay', 'Select', from, { items: ['list','add','remove','setdisplay'] } );
	this.createParam ( container, 'set | add | remove | reset | list', 'Select', from, { items: ['set','add','remove','reset','list'] } );
	this.createParam ( container, 'list | add | remove | empty | join | leave | option', 'Select', from, { items: ['list','add','remove','empty','join','leave','option'] } );*/
}

CommandScoreBoard.prototype = new Command ( );

function CommandSetBlock ( container, from )
{
	this.init ( container, 'setblock', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'x', 'Pos', from );
	this.createParam ( container, 'y', 'Pos', from, { height: true } );
	this.createParam ( container, 'z', 'Pos', from );
	//this.createParam ( container, 'tilename datavalue', 'Block', from, { ignoreValue: true, stringIds: true } );
	this.createParam ( container, 'tilename datavalue', 'Select', from, { ignoreValue: true, stringIds: true, items: blocks, value: '{id} {data}', custom: true } );
	this.createParam ( container, 'tilename', 'Text', from, { ignoreIfHidden: false } );
	this.createParam ( container, 'datavalue', 'Number', from, { optional: true, ignoreIfHidden: false, defaultValue: 0, min:0, max:15 } );
	this.createParam ( container, 'oldblockHandling', 'Select', from, { optional: true, items: ['replace','keep','destory'], defaultValue: 'replace' } );
	this.createParam ( container, 'dataTag', 'DataTag', from, { optional: true, type: 'Block' } );
}

CommandSetBlock.prototype = new Command ( );

CommandSetBlock.prototype.update = function ( )
{
	var selectValue = this.params['tilename datavalue'].value.value.toString ( );
	
	if ( selectValue === 'custom' )
	{
		this.params.tilename.container.style.display = '';
		this.params.datavalue.container.style.display = '';
	}
	else
	{
		var itemMetadata = selectValue.split ( ' ' );

		this.params.tilename.value.setValue ( itemMetadata[0] || '' );
		this.params.tilename.container.style.display = 'none';
		
		if ( itemMetadata[1] !== '*' )
		{
			this.params.datavalue.value.setValue ( itemMetadata[1] || '' );
			this.params.datavalue.container.style.display = 'none';
		}
		else
			this.params.datavalue.container.style.display = '';
	}
	
	var blockId = this.params.tilename.value.value;
	var block;
	
	for ( var i = 0; i < blocks.length; i++ )
	{
		block = blocks[i];
		
		if ( block.id == blockId || block.stringId == blockId )
		{
			var structure = block.structure || 'Block'
			if ( structure != this.params.dataTag.value.type )
				this.params.dataTag.value.updateType ( structure )
			break
		}
	}

	this.updateLoop ( );
}

function CommandSpawnPoint ( container, from )
{
	this.init ( container, 'spawnpoint', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'player', 'PlayerSelector', from, { optional: true } );
	this.createParam ( container, 'x', 'Pos', from, { optional: true } );
	this.createParam ( container, 'y', 'Pos', from, { optional: true, height: true } );
	this.createParam ( container, 'z', 'Pos', from, { optional: true } );
}

CommandSpawnPoint.prototype = new Command ( );

function CommandSpreadPlayers ( container, from )
{
	this.init ( container, 'spreadplayers', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'x', 'Pos', from );
	this.createParam ( container, 'z', 'Pos', from );
	this.createParam ( container, 'spreadDistance', 'Number', from, {isFloat:true} );
	this.createParam ( container, 'maxRange', 'Number', from );
	//this.createParam ( container, 'respectTeams', 'Select', from, { items: ['true','false'] } );
	this.createParam ( container, 'respectTeams', 'Boolean', from );
	this.createParam ( container, 'player', 'PlayerSelector', from );

	var button = document.createElement ( 'button' );
	button.appendChild ( document.createTextNode ( 'Add Player' ) );
	button.addEventListener ( 'click', ( function ( command ) { return function ( e ) { command.onAddClick ( e ) } } ) ( this ) );
	container.appendChild ( button );
}

CommandSpreadPlayers.prototype = new Command ( );

CommandSpreadPlayers.prototype.onAddClick = onAddClick;

CommandSpreadPlayers.prototype.addItem = function ( )
{
	this.createParam ( this.container, 'player', 'PlayerSelector', null, { remove: true } );
}

function CommandSummon ( container, from )
{
	this.init ( container, 'summon', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'Entity', 'Select', from, { ignoreValue: true, stringIds: true, items: entities, custom: true } );
	//this.createParam ( container, 'Entity', 'Entity', from, { ignoreValue: true } );
	this.createParam ( container, 'EntityName', 'Text', from, { ignoreIfHidden: false } );
	this.createParam ( container, 'x', 'Pos', from );
	this.createParam ( container, 'y', 'Pos', from, { height: true } );
	this.createParam ( container, 'z', 'Pos', from );
	this.createParam ( container, 'dataTag', 'DataTag', from, { optional: true } );
}

CommandSummon.prototype = new Command ( );

CommandSummon.prototype.update = function ( )
{
	var entityName = this.params.Entity.value.value;
	
	if ( entityName === 'custom' )
	{
		this.params.EntityName.container.style.display = '';
	}
	else
	{
		this.params.EntityName.value.setValue ( this.params.Entity.value.value );
		this.params.EntityName.container.style.display = 'none';
	}
	
	var entity;
	
	for ( var i = 0; i < entities.length; i++ )
	{
		entity = entities[i];
		
		if ( typeof entity !== 'string' && entity.id == entityName )
		{
			var structure = entity.structure || {}
			if ( structure != this.params.dataTag.value.type )
				this.params.dataTag.value.updateType ( structure )
			break
		}
	}

	this.updateLoop ( );
}

function CommandTell ( container, from )
{
	this.name = 'tell'
	this.description = '';
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.paramsOrdered;

	this.createParam ( container, 'player', 'PlayerSelector', from );
	this.createParam ( container, 'message', 'Text', from );
}

CommandTell.prototype = new Command ( );

function CommandTellRaw ( container, from )
{
	this.init ( container, 'tellraw', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'player', 'PlayerSelector', from );
	this.createParam ( container, 'rawmessage', 'RawMessage', from, { isRoot: true, hasEvents: true } );
}

CommandTellRaw.prototype = new Command ( );

function CommandTestFor ( container, from )
{
	this.init ( container, 'testfor', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'player', 'PlayerSelector', from );
}

CommandTestFor.prototype = new Command ( );

function CommandTestForBlock ( container, from )
{
	this.init ( container, 'testforblock', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'x', 'Pos', from );
	this.createParam ( container, 'y', 'Pos', from, { height: true } );
	this.createParam ( container, 'z', 'Pos', from );
	//this.createParam ( container, 'tilename datavalue', 'Block', from, { ignoreValue: true } );
	this.createParam ( container, 'tilename datavalue', 'Select', from, { ignoreValue: true, stringIds: true, items: blocks, value: '{id} {data}', custom: true } );
	this.createParam ( container, 'tilename', 'Text', from, { ignoreIfHidden: false } );
	this.createParam ( container, 'datavalue', 'Number', from, { optional: true, ignoreIfHidden: false, defaultValue: 0, min:0, max:15 } );
	this.createParam ( container, 'dataTag', 'DataTag', from, { optional: true, type: 'Block' } );
}

CommandTestForBlock.prototype = new Command ( );

CommandTestForBlock.prototype.update = function ( )
{
	var selectValue = this.params['tilename datavalue'].value.value.toString ( );
	
	if ( selectValue === 'custom' )
	{
		this.params.tilename.container.style.display = '';
		this.params.datavalue.container.style.display = '';
	}
	else
	{
		var itemMetadata = selectValue.split ( ' ' );

		this.params.tilename.value.setValue ( itemMetadata[0] || '' );
		this.params.datavalue.value.setValue ( itemMetadata[1] || '' );
		
		this.params.tilename.container.style.display = 'none';
		this.params.datavalue.container.style.display = 'none';
	}
	
	var tilename = this.params.tilename.value.value;
	var block;
	
	for ( var i = 0; i < blocks.length; i++ )
	{
		block = blocks[i];
		
		if ( block.id == tilename || block.tilename == tilename )
		{
			var structure = block.structure || 'Block'
			if ( structure != this.params.dataTag.value.type )
				this.params.dataTag.value.updateType ( structure )
			break
		}
	}

	this.updateLoop ( );
}

function CommandTime ( container, from )
{
	this.init ( container, 'time', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'set | add', 'Select', from, { items: ['set','add'] } );
	this.createParam ( container, 'number', 'Number', from ); // Add day/night
}

CommandTime.prototype = new Command ( );

function CommandToggleDownFall ( container, from )
{
	this.init ( container, 'toggledownfall', '' )
}

CommandToggleDownFall.prototype = new Command ( );

function CommandTP ( container, from )
{
	this.init ( container, 'tp', '' )
	this.groupPrefix = 'tp-' + (++groupPrefix)

	from = from && from.paramsOrdered;

	this.createParam ( container, 'player', 'PlayerSelector', from, { completelyOptional: true } );
	this.createParam ( container, 'destination player', 'PlayerSelector', from, { group: 'dest', groupIndex: 0, groupPrefix: this.groupPrefix } );
	this.createParam ( container, 'x', 'Pos', from, { group: 'dest', groupIndex: 1, groupPrefix: this.groupPrefix } );
	this.createParam ( container, 'y', 'Pos', from, { group: 'dest', groupIndex: 1, groupPrefix: this.groupPrefix } );
	this.createParam ( container, 'z', 'Pos', from, { group: 'dest', groupIndex: 1, groupPrefix: this.groupPrefix } );
}

CommandTP.prototype = new Command ( );

function CommandWeather ( container, from )
{
	this.init ( container, 'weather', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'clear | rain | thunder', 'Select', from, { items: ['clear','rain','thunder'] } );
	this.createParam ( container, 'seconds', 'Number', from, { optional: true, min: 1, max: 1000000 } );
}

CommandWeather.prototype = new Command ( );

function CommandXP ( container, from )
{
	this.init ( container, 'xp', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'amount', 'XP', from );
	this.createParam ( container, 'player', 'PlayerSelector', from, { optional: true } );
}

CommandXP.prototype = new Command ( );

function Param ( )
{
}

Param.prototype = new Command ( );

Param.prototype.init = function ( container, description, options )
{
	var defaultOptions = {
		optional: false
	};
	
	options = mergeObjects ( options, defaultOptions );
	
	this.container = container
	
	this.description = description
	
	this.params = {};
	this.paramsOrdered = [];
	
	this.options = options;
}

Param.prototype.selectGroup = function ( )
{
	var radio = this.options && this.options.groupRadiobox;
	
	if ( !radio || radio.nodeName !== 'INPUT' || radio.type !== 'radio' )
		return false
	
	radio.checked = true;
	
	updateCommand ( )
}

Param.prototype.onValueChange = function ( e )
{
	e = e || window.event;
	var target = e.target || e.srcElement;

	this.setValue ( target.nodeName == 'INPUT' || target.nodeName == 'SELECT' ? target.value : target.getAttribute ( 'data-value' ) );

	updateCommand ( );
}

Param.prototype.setValue = function ( v )
{
	if ( this.input )
	{
		this.value = v;
		this.input.value = this.value;
	}
	else
	{
		this.value = v;
	}
	
	this.selectGroup ( );
}

Param.prototype.toString = function ( needValue )
{
	var value = this.value;
	var defaultValue = this.options && this.options.defaultValue !== null ? this.options.defaultValue : '';
	
	if ( needValue && value === '' && defaultValue !== '' )
		value = defaultValue
	else if ( !needValue && value == defaultValue )
		value = '';
	
	if ( this.options && this.options.quote && value !== '' )
		value = quote ( value )
	
	return value;
}

Param.prototype.setError = function ( error )
{
	if ( !this.input )
		return;
		
	if ( error )
		this.input.className = 'error'
	else
		this.input.className = ''
}

Param.prototype.update = function ( nextHasValue )
{
	if ( !this.input )
		return;
	
	var required = !this.options.optional || nextHasValue || false;

	if ( required )
		this.input.className = this.value === '' ? 'error' : '';
}

function ParamAchievement ( container, from, options )
{
	this.init ( container, '', options );
	
	/*var achievements = {
		'openInventory': 'Taking Inventory',
		'mineWood': 'Getting Wood',
		'buildWorkBench': 'Benchmarking',
		'buildPickaxe': 'Time to Mine!',
		'buildFurnace': 'Hot Topic',
		'acquireIron': 'Acquire Hardware',
		'buildHoe': 'Time to Farm!',
		'makeBread': 'Bake Bread',
		'bakeCake': 'The Lie',
		'buildBetterPickaxe': 'Getting an Upgrade',
		'cookFish': 'Delicious Fish',
		'onARail': 'On A Rail',
		'buildSword': 'Time to Strike!',
		'killEnemy': 'Monster Hunter',
		'killCow': 'Cow Tipper',
		'flyPig': 'When Pigs Fly',
		'snipeSkeleton': 'Sniper Duel',
		'diamonds': 'DIAMONDS!',
		'portal': 'We Need to Go Deeper',
		'ghast': 'Return to Sender',
		'blazeRod': 'Into Fire',
		'potion': 'Local Brewery',
		'theEnd': 'The End?',
		'theEnd2': 'The End.',
		'enchantments': 'Enchanter',
		'overkill': 'Overkill',
		'bookcase': 'Librarian',
		'exploreAllBiomes': 'Adventuring Time',
		'spawnWither': 'The Beginning?',
		'killWither': 'The Beginning.',
		'fullBeacon': 'Beaconator',
		'breedCow': 'Repopulation'
	};

	var stats = {
	};*/
	
	var optgroup, option, i;

	var value = from && from.value || options && options.defaultValue;

	var select = document.createElement ( 'select' )
	select.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onValueChange ( e ) } } ) ( this ) );
	
	if ( this.options.optional )
	{
		option = document.createElement ( 'option' );
		option.value = '';
		option.appendChild ( document.createTextNode ( 'None' ) );
		select.appendChild ( option );
	}
	
	optgroup = document.createElement ( 'optgroup' )
	optgroup.label = 'Achievements';
	select.appendChild ( optgroup );

	for ( i = 0; i < achievements.length; i++  )
	{
		option = document.createElement ( 'option' );
		option.selected = ( achievements[i].stringId == ( value || this.options.defaultValue ) )
		option.value = achievements[i].stringId;
		option.appendChild ( document.createTextNode ( achievements[i].name ) );
		optgroup.appendChild ( option );
	}

	optgroup = document.createElement ( 'optgroup' )
	optgroup.label = 'Statistics';
	select.appendChild ( optgroup );

	for ( i = 0; i < statistics.length; i++  )
	{
		option = document.createElement ( 'option' );
		option.selected = ( statistics[i].stringId == ( value || this.options.defaultValue ) )
		option.value = statistics[i].stringId;
		option.appendChild ( document.createTextNode ( statistics[i].name ) );
		optgroup.appendChild ( option );
	}

	this.input = select;
	this.value = select.value;

	container.appendChild ( select );
}

ParamAchievement.prototype = new Param ( );

function ParamBlock ( container, from, options )
{
	this.init ( container, '', options );
	
	var option, block;

	this.value = from && from.value;

	var select = document.createElement ( 'select' )
	select.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onValueChange ( e ) } } ) ( this ) );

	if ( options.optional )
	{
		option = document.createElement ( 'option' );
		option.value = '';
		option.appendChild ( document.createTextNode ( 'None' ) );
		select.appendChild ( option );
	}

	for ( var i = 0; i < blocks.length; i++ )
	{
		block = blocks[i];
		block.uid = ( ( this.options.stringId ? block.stringId : block.id ) + ' ' + block.data )
		
		option = document.createElement ( 'option' );
		option.selected = ( block.uid == ( this.value || options.defaultValue ) )
		option.value = block.uid;
		option.appendChild ( document.createTextNode ( block.name ) );
		select.appendChild ( option );
	}

	option = document.createElement ( 'option' );
	option.value = 'custom';
	option.appendChild ( document.createTextNode ( 'Custom' ) );
	select.appendChild ( option );

	this.value = select.value;

	container.appendChild ( select );
}

ParamBlock.prototype = new Param ( );

function ParamBoolean ( container, from, options )
{
	this.init ( container, '', options );
	
	this.checked = from && from.value || 'false'
	this.value = this.checked == 'true' ? 'true' : ( options.optional ? '' : 'false' )

	var input = document.createElement ( 'input' )
	input.type = 'checkbox'
	input.checked = this.value == 'true'
	input.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onCheckboxChange ( e ) } } ) ( this ) );
	
	this.input = input;
	
	container.appendChild ( input );
}

ParamBoolean.prototype = new Param ( );

ParamBoolean.prototype.onCheckboxChange = function ( e )
{
	e = e || window.event;
	var target = e.target || e.srcElement;
	
	this.checked = target.checked ? 'true' : 'false'
	
	if ( this.options && this.options.numberOutput )
		this.value = this.checked == 'true' ? '1' : ( this.options.optional ? '' : '0' )
	else
		this.value = this.checked == 'true' ? 'true' : ( this.options.optional ? '' : 'false' )

	updateCommand ( );
}

function ParamCommandSelector ( container, from, options )
{
	this.init ( container, '', options );

	this.commandSelector = new CommandSelector ( container );
}

ParamCommandSelector.prototype = new Param ( );

ParamCommandSelector.prototype.update = function ( )
{
	this.commandSelector.update ( );
}

ParamCommandSelector.prototype.toString = function ( )
{
	var value = this.commandSelector.toString ( );
	
	if ( this.options && this.options.quote )
		value = quote ( value )
	
	return value 
}

function ParamDataTag ( container, from, options )
{
	this.init ( container, '', options );
	
	this.tag = null;

	this.createHTML ( container, ( options && options.selector ) || false );

	this.tag = from && from.tag;
	this.type = ( this.selector && this.selector.value ) || ( options && options.type );

	if ( this.type )
		this.updateType ( this.type );
}

ParamDataTag.prototype = new Param ( );

ParamDataTag.prototype.createHTML = function ( container, showSelector )
{
	container.className += ' mc-tag';

	if ( showSelector )
	{
		var option;
		
		var selector = document.createElement ( 'select' );
		selector.className = 'mc-player-selector';
		selector.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onSelectorChange ( e ) } } ) ( this ) );
		container.appendChild ( selector );

		if ( this.options.optional )
		{
			option = document.createElement ( 'option' );
			option.appendChild ( document.createTextNode ( 'None' ) );
			selector.appendChild ( option );
		}

		option = document.createElement ( 'option' );
		option.appendChild ( document.createTextNode ( 'Username' ) );
		selector.appendChild ( option );
		
		this.selector = selector;
	}

	var options = document.createElement ( 'div' );
	container.appendChild ( options );

	this.options = options;
}

ParamDataTag.prototype.updateType = function ( type )
{
	var options = this.options;

	options.innerHTML = '';
	
	this.type = type;

	if ( this.selector )
		this.selector.value = type;

	this.tag = new tags['Compound'] ( options, this.tag, { optional: this.options.optional, structure: type } );
}

ParamDataTag.prototype.update = function ( )
{
	if ( this.tag )
		this.tag.update ( );
}

ParamDataTag.prototype.toString = function ( )
{
	return this.tag ? this.tag.toString ( ) : '';
}

function ParamEnchantment ( container, from, options )
{
	this.init ( container, '', options );
	
	var option;
	
	/*var enchantments = {
		0: 'Protection',
		1: 'Fire Protection',
		2: 'Feather Falling',
		3: 'Blast Protection',
		4: 'Projectile Protection',
		5: 'Respiration',
		6: 'Aqua Affinity',
		7: 'Thorns',


		16: 'Sharpness',
		17: 'Smite',
		18: 'Bane of Arthropods',
		19: 'Knockback',
		20: 'Fire Aspect',
		21: 'Looting',


		32: 'Efficiency',
		33: 'Silk Touch',
		34: 'Unbreaking',
		35: 'Fortune',


		48: 'Power',
		49: 'Punch',
		50: 'Flame',
		51: 'Infinity',

		61: 'Luck of the Sea',
		62: 'Lure'
	};*/

	this.value = from && from.value;

	var select = document.createElement ( 'select' )
	select.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onValueChange ( e ) } } ) ( this ) );

	if ( options.optional )
	{
		option = document.createElement ( 'option' );
		option.value = '';
		option.appendChild ( document.createTextNode ( 'None' ) );
		select.appendChild ( option );
	}
	
	for ( var i = 0; i < enchantments.length; i++ )
	{
		var option = document.createElement ( 'option' );
		option.selected = ( enchantments[i].id == ( this.value || options.defaultValue ) )
		option.value = enchantments[i].id;
		option.appendChild ( document.createTextNode ( enchantments[i].name ) );
		select.appendChild ( option );
	}

	this.value = select.value;

	container.appendChild ( select );
}

ParamEnchantment.prototype = new Param ( );

function ParamEntity ( container, from, options )
{
	this.init ( container, '', options );
	
	var option, entity;

	this.value = from && from.value;

	var select = document.createElement ( 'select' )
	select.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onValueChange ( e ) } } ) ( this ) );

	if ( options.optional )
	{
		option = document.createElement ( 'option' );
		option.value = '';
		option.appendChild ( document.createTextNode ( 'None' ) );
		select.appendChild ( option );
	}
	
	var optionParent = select;

	for ( var i = 0; i < entities.length; i++ )
	{
		entity = entities[i];
		
		if ( typeof entity === 'string' )
		{
			optionParent = document.createElement ( 'optgroup' );
			optionParent.label = entity;
			select.appendChild ( optionParent );
		}
		else
		{
			option = document.createElement ( 'option' );
			option.selected = ( entity.id == ( this.value || options && options.defaultValue ) )
			option.value = entity.id;
			option.appendChild ( document.createTextNode ( entity.name ) );
			optionParent.appendChild ( option );
		}
	}

	option = document.createElement ( 'option' );
	option.value = 'custom';
	option.appendChild ( document.createTextNode ( 'Custom' ) );
	select.appendChild ( option );

	this.value = select.value;

	container.appendChild ( select );
}

ParamEntity.prototype = new Param ( );

function ParamItem ( container, from, options )
{
	this.init ( container, '', options );
	
	var option, item;

	this.value = from && from.value || '';

	var select = document.createElement ( 'select' )
	select.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onValueChange ( e ) } } ) ( this ) );

	if ( options.optional )
	{
		option = document.createElement ( 'option' );
		option.value = '';
		option.appendChild ( document.createTextNode ( 'None' ) );
		select.appendChild ( option );
	}

	for ( var i = 0; i < items.length; i++ )
	{
		item = items[i]
		item.uid = ( this.options.stringId ? item.stringId : item.id ) + ' ' + item.data
		
		option = document.createElement ( 'option' );
		option.selected = ( item.uid == ( this.value || options && options.defaultValue ) )
		option.value = item.uid;
		option.appendChild ( document.createTextNode ( item.name ) );
		select.appendChild ( option );
	}

	option = document.createElement ( 'option' );
	option.value = '0';
	option.appendChild ( document.createTextNode ( 'Custom' ) );
	select.appendChild ( option );

	this.value = select.value;

	container.appendChild ( select );
}

ParamItem.prototype = new Param ( );

function ParamItemTag ( container, from, options )
{
	this.init ( container, '', options );
	
	this.createParam ( container, 'item metadata', 'Select', from, { ignoreValue: true, items: items, value: '{id} {data}', custom: true } );
	//this.createParam ( container, 'item metadata', 'Item', from, { ignoreValue: true } ); // New ParamItem, list of all items + custom
	this.createParam ( container, 'item', 'Number', from, { ignoreIfHidden: false, min:1 } );
	this.createParam ( container, 'metadata', 'Number', from, { ignoreIfHidden: false, defaultValue: 0, min: 0, max: 15 } );
	this.createParam ( container, 'dataTag', 'DataTag', from, { optional: true, type: 'Item' } );
}

ParamItemTag.prototype = new Param ( );

ParamItemTag.prototype.update = function ( )
{
	if ( this.params['item metadata'].value.value === '0' )
	{
		this.params.item.container.style.display = '';
		this.params.metadata.container.style.display = '';
	}
	else
	{
		var itemMetadata = this.params['item metadata'].value.value.split ( ' ' );

		this.params.item.value.setValue ( itemMetadata[0] || '' );
		this.params.item.container.style.display = 'none';
		
		if ( itemMetadata[1] !== '*' )
		{
			this.params.metadata.value.setValue ( itemMetadata[1] || '' );
			this.params.metadata.container.style.display = 'none';
		}
	}

	this.updateLoop ( );
}

ParamItemTag.prototype.toString = function ( )
{
	var itemID = this.params.item.value
	var itemDamage = this.params.metadata.value
	var tag = this.params.dataTag.value
	
	return quote ( '{id:' + itemID + ( itemDamage != '' ? ',Damage:' + itemDamage : '' ) + ( tag != '' ? ',tag:' + tag : '' ) + '}' )
}

function ParamSelect ( container, from, options )
{
	this.init ( container, '', options );

	this.item = null;
	this.value = from && from.value;
	
	if ( this.options.editable )
		this.createEditable ( )
	else
		this.createSelectable ( )
}

ParamSelect.prototype = new Param ( );

ParamSelect.prototype.createEditable = function ( )
{
	var options = this.options;
	
	var edit = document.createElement ( 'input' )
	edit.addEventListener ( 'keyup', ( function ( param ) { return function ( e ) { param.onSearch ( e ) } } ) ( this ) );
	edit.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onValueChange ( e ) } } ) ( this ) );
	edit.addEventListener ( 'focus', ( function ( param ) { return function ( e ) { param.onEditFocus ( e ) } } ) ( this ) );
	edit.addEventListener ( 'blur', ( function ( param ) { return function ( e ) { param.onEditBlur ( e ) } } ) ( this ) );
	edit.value = this.value || this.options.defaultValue || ''
	
	this.container.appendChild ( edit )
	
	var list = document.createElement ( 'ul' )
	list.className = 'mc-select-list';
	
	if ( this.options.optional && this.options.defaultValue == null )
	{
		option = document.createElement ( 'li' );
		option.value = '';
		option.appendChild ( document.createTextNode ( 'None' ) );
		list.appendChild ( option );
	}
	
	var valueTemplate = this.options.value || '{id}';
	var item;
	for ( var i = 0; i < this.options.items.length; i++ )
	{
		item = this.options.items[i];
		
		if ( typeof item == 'string' )
			item = { name: item, stringId: item }
			
		if ( item.group != null )
		{
			option = document.createElement ( 'li' )
			option.className = 'mc-select-list-group'
			option.appendChild ( document.createTextNode ( item.group ) )
			parent = document.createElement ( 'ul' )
			option.appendChild ( parent )
			list.appendChild ( option );
		}
		
		if ( !item.stringId && !item.id )
			continue;
			
		var value = valueTemplate.replace('{id}', this.options.stringIds ? item.stringId || item.id : item.id || item.stringId );
		for ( var x in item )
		{
			value = value.replace ( '{' + x + '}', item[x] );
		}
		
		option = document.createElement ( 'li' );
		option.addEventListener ( 'click', ( function ( param ) { return function ( e ) { param.onValueChange ( e ); } } ) ( this ) );
		option.className = 'mc-select-list-item'
		option.setAttribute('data-value', value);
		option.setAttribute('data-search', (value + (item.name || item.stringId || item.id || '' )).toLowerCase());
		option.setAttribute('data-index', i);
		option.selected = ( value == ( this.value || this.options.defaultValue ) )
		if ( option.selected )
			this.item = item;
		option.appendChild ( document.createTextNode ( item.name || item.stringId || item.id ) );
		parent.appendChild ( option );
	}
	
	this.container.appendChild ( list )

	this.setValue ( edit.value );
	this.input = edit;
	this.list = list;
}

ParamSelect.prototype.onSearch = function ( e )
{
	e = e || window.event;
	var target = e.target || e.srcElement;
	
	var search = target.value.toLowerCase();
	
	if ( this.options.editable )
		this.search ( this.list.children, search );
}

ParamSelect.prototype.search = function ( items, value )
{
	var visible = 0;
	for ( var i = 0; i < items.length; i++ )
	{
		var item = items[i];
		if ( item.className == 'mc-select-list-item' && item.getAttribute('data-search').indexOf ( value ) == -1 )
		{
			item.style.display = 'none';
		}
		else
		{
			visible++;
			item.style.display = '';
			if ( item.className == 'mc-select-list-group' )
			{
				if ( this.search ( item.children[0].children, value ) == 0 )
				{
					item.style.display = 'none';
					visible--;
				}
			}
		}
	}
	return visible;
}

ParamSelect.prototype.onEditFocus = function ( e )
{
	this.list.className = 'mc-select-list mc-select-list-active'
}

ParamSelect.prototype.onEditBlur = function ( e )
{
	setTimeout ( ( function ( param ) { return function ( ) { param.list.className = 'mc-select-list' } } ) ( this ), 250 );
}

ParamSelect.prototype.createSelectable = function ( )
{
	var options = this.options;
	
	var select = document.createElement ( 'select' )
	select.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onValueChange ( e ) } } ) ( this ) );
	
	var option;
	
	if ( this.options.optional && this.options.defaultValue == null )
	{
		option = document.createElement ( 'option' );
		option.value = '';
		option.appendChild ( document.createTextNode ( 'None' ) );
		select.appendChild ( option );
	}
	
	var parent = select;
	
	var valueTemplate = this.options.value || '{id}';
	var item;
	for ( var i = 0; i < this.options.items.length; i++ )
	{
		item = options.items[i];
		
		if ( typeof item == 'string' )
			item = { name: item, stringId: item }
			
		if ( item.group != null )
		{
			parent = document.createElement ( 'optgroup' )
			parent.label = item.group;
			select.appendChild ( parent );
		}
		
		if ( !item.stringId && !item.id )
			continue;
		
		var value = valueTemplate.replace('{id}', this.options.stringIds ? item.stringId || item.id : item.id || item.stringId );
		for ( var x in item )
		{
			value = value.replace ( '{' + x + '}', item[x] );
		}
		
		option = document.createElement ( 'option' );
		option.value = value;
		option.setAttribute('data-index', i);
		option.selected = ( value == ( this.value || this.options.defaultValue ) )
		if ( option.selected )
			this.item = item;
		option.appendChild ( document.createTextNode ( item.name || item.stringId || item.id ) );
		parent.appendChild ( option );
	}
	
	if ( this.options.custom )
	{
		option = document.createElement ( 'option' );
		option.value = 'custom';
		option.appendChild ( document.createTextNode ( 'Custom' ) );
		select.appendChild ( option );
	}

	this.setValue ( select.value );
	this.input = select;

	this.container.appendChild ( select );
}

ParamSelect.prototype.update = function ( nextHasValue )
{
	this.setError ( false );

	var required = !this.options.optional || nextHasValue || false;

	if ( required && this.value === '' )
		this.setError ( true );
	else if ( this.options.editable )
	{
		if ( !this.options.custom )
		{
			var found = false
			var valueTemplate = this.options.value || '{id}';
			var item;
			for ( var i = 0; i < this.options.items.length; i++ )
			{
				item = this.options.items[i];
				
				if ( typeof item == 'string' )
					item = { name: item, stringId: item }
				
				if ( !item.stringId && !item.id )
					continue;
				
				var value = valueTemplate.replace('{id}', this.options.stringIds ? item.stringId || item.id : item.id || item.stringId );
				for ( var x in item )
				{
					value = value.replace ( '{' + x + '}', item[x] );
				}
				
				if ( value == this.value )
				{
					found = true;
					break;
				}
			}
			
			if ( !found )
				this.setError ( true );
		}
	}
	
	if ( !this.options.editable )
	{
		var option = this.input.selectedOptions[0];
			
		if ( option )
			this.item = option.hasAttribute ( 'data-index' ) ? this.options.items[option.getAttribute ( 'data-index' )] || null : null
	}
}

function ParamPlayerSelector ( container, from, options )
{
	this.init ( container, '', options );
	
	this.player = null;

	this.createHTML ( container );

	this.player = from && from.player;
	var selectorValue = from && from.selector && from.selector.value || this.selector.value;

	this.updatePlayer ( selectorValue );
}

ParamPlayerSelector.prototype = new Param ( );

ParamPlayerSelector.prototype.createHTML = function ( container )
{
	container.className += ' mc-player';

	var selector = document.createElement ( 'select' );
	selector.className = 'mc-player-selector';
	selector.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onSelectorChange ( e ) } } ) ( this ) );
	container.appendChild ( selector );

	if ( this.options.optional )
	{
		var option = document.createElement ( 'option' );
		option.appendChild ( document.createTextNode ( 'None' ) );
		selector.appendChild ( option );
	}

	var option = document.createElement ( 'option' );
	option.appendChild ( document.createTextNode ( 'Username' ) );
	selector.appendChild ( option );

	var option = document.createElement ( 'option' );
	option.appendChild ( document.createTextNode ( '@p' ) );
	selector.appendChild ( option );

	var option = document.createElement ( 'option' );
	option.appendChild ( document.createTextNode ( '@a' ) );
	selector.appendChild ( option );

	var option = document.createElement ( 'option' );
	option.appendChild ( document.createTextNode ( '@r' ) );
	selector.appendChild ( option );

	var optionsContainer = document.createElement ( 'table' );
	optionsContainer.className = 'mc-player-options';
	container.appendChild ( optionsContainer );

	this.selector = selector;
	this.optionsContainer = optionsContainer;
}

ParamPlayerSelector.prototype.onSelectorChange = function ( e )
{
	e = e || window.event;
	var target = e.target || e.srcElement;

	var player = target.value;

	if ( !player )
		return;

	var container = target.parentNode;

	this.updatePlayer ( player );
	
	this.selectGroup ( )

	updateCommand ( );
}

ParamPlayerSelector.prototype.updatePlayer = function ( player )
{
	var optionsContainer = this.optionsContainer;

	optionsContainer.innerHTML = '';
	
	if ( !this.options.optional && player == 'None' )
		player = 'Username'

	this.selector.value = player;

	switch ( player )
	{
		case 'None':
			this.player = null;
		break;
		case 'Username':
			this.player = new PlayerUsername ( optionsContainer, false, this.player );
		break;
		default:
			this.player = new PlayerSelector ( optionsContainer, player, this.options.optional, this.player );
	}
}

ParamPlayerSelector.prototype.update = function ( nextHasValue )
{
	this.selector.className = 'mc-player-selector';

	if ( this.player )
		this.player.update ( nextHasValue );
	else if ( nextHasValue )
		this.selector.className = 'mc-player-selector error';

}

ParamPlayerSelector.prototype.toString = function ( )
{
	return this.player ? this.player.toString ( ) : '';
}

function ParamPos ( container, from, options )
{
	this.init ( container, '', options );
	
	this.isRelative = from && from.isRelative ? from.isRelative : false;
	this.value = from && from.value ? from.value : '';

	var label = document.createElement ( 'label' );
	container.appendChild ( label );

	var input = document.createElement ( 'input' );
	input.type = 'checkbox'
	input.checked = this.isRelative;
	input.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onCheckChange ( e ) } } ) ( this ) );
	label.appendChild ( input );
	label.appendChild ( document.createTextNode ( ' Relative ' ) );

	var input = document.createElement ( 'input' );
	input.type = 'number'
	if ( options && options.height )
	{
		input.min = 0;
		input.max = 255;
	}
	if ( options && options.isFloat )
		input.step = "any";
	if ( options && options.defaultValue !== undefined )
		input.placeholder = options.defaultValue;
	input.value = this.value;
	input.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onValueChange ( e ) } } ) ( this ) );
	container.appendChild ( input );

	this.input = input;
}

ParamPos.prototype = new Param ( );

ParamPos.prototype.onCheckChange = function ( e )
{
	e = e || window.event;
	var target = e.target || e.srcElement;

	this.isRelative = target.checked;

	if ( this.options && this.options.height )
	{
		if ( this.isRelative )
		{
			this.input.min = null;
			this.input.max = null;
		}
		else
		{
			this.input.min = 0;
			this.input.max = 255;
		}
	}
	
	this.selectGroup ( )

	updateCommand ( );
}

ParamPos.prototype.update = function ( nextHasValue )
{
	this.setError ( false );

	var required = !this.options.optional || nextHasValue || false;

	if ( required && !this.isRelative && this.value === '' )
		this.setError ( true );

	if ( this.input.className === '' && this.value !== '' && isNaN ( parseInt ( this.value ) ) )
		this.setError ( true );

	if ( this.input.className === '' && this.value !== '' && this.options && this.options.height && !this.isRelative && parseInt ( this.value ) > 255 )
		this.setError ( true );

	if ( this.input.className === '' && this.value !== '' && this.options && this.options.height && !this.isRelative && parseInt ( this.value ) < 0 )
		this.setError ( true );

	if ( this.input.className === '' && this.value !== '' && ( !this.options || !this.options.isFloat ) && parseInt ( this.value ) != this.value )
		this.setError ( true );

	if ( this.input.className === '' && this.value !== '' && ( this.options && this.options.isFloat ) && parseFloat ( this.value ) != this.value )
		this.setError ( true );
}

ParamPos.prototype.toString = function ( )
{
	return ( this.isRelative ? '~' : '' ) + this.value;
}

function ParamPotion ( container, from, options )
{
	this.init ( container, '', options );
	
	/*var potions = {
		1: 'Speed',
		2: 'Slowness',
		3: 'Haste',
		4: 'Mining Fatigue',
		5: 'Strength',
		6: 'Instant Health',
		7: 'Instant Damage',
		8: 'Jump Boost',
		9: 'Nausea',
		10: 'Regeneration',
		11: 'Resistance',
		12: 'Fire Resistance',
		13: 'Water Breathing',
		14: 'Invisibility',
		15: 'Blindness',
		16: 'Night Vision',
		17: 'Hunger',
		18: 'Weakness',
		19: 'Poison',
		20: 'Wither',
		21: 'Health Boost',
		22: 'Absorption',
		23: 'Saturation'
	};*/

	this.value = from && from.value;

	var select = document.createElement ( 'select' )
	select.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onValueChange ( e ) } } ) ( this ) );

	var option = document.createElement ( 'option' );
	option.value = 'clear';
	option.appendChild ( document.createTextNode ( 'Clear' ) );
	select.appendChild ( option );

	for ( var i = 0; i < potions.length; i++ )
	{
		var option = document.createElement ( 'option' );
		option.selected = ( potions[i].id == ( this.value || options.defaultValue ) )
		option.value = potions[i].id;
		option.appendChild ( document.createTextNode ( potions[i].id + '. ' + potions[i].name ) );
		select.appendChild ( option );
	}

	this.value = select.value;

	container.appendChild ( select );
}

ParamPotion.prototype = new Param ( );

function ParamRawMessage ( container, from, options )
{
	this.init ( container, '', options );
	
	this.params = {};
	this.paramsOrdered = [];
	this.groupPrefix = 'raw-message-' + (++groupPrefix)
	
	container.className += ' mc-raw-message';

	var table = document.createElement ( 'table' );
	container.appendChild ( table );
	
	this.createParam ( table, 'text', 'Text', from, { group: 'text', groupIndex: 0, groupPrefix: this.groupPrefix, quote: true, hasSpecial: true } );
	this.createParam ( table, 'translate', 'Select', from, { group: 'text', groupIndex: 1, groupPrefix: this.groupPrefix, items: translatables, quote: true } );
	this.createParam ( table, 'color', 'Select', from, { optional: true, items: colors } );
	this.createParam ( table, 'bold', 'Boolean', from, { optional: true } );
	this.createParam ( table, 'underlined', 'Boolean', from, { optional: true } );
	this.createParam ( table, 'italic', 'Boolean', from, { optional: true } );
	this.createParam ( table, 'strikethrough', 'Boolean', from, { optional: true } );
	this.createParam ( table, 'obfuscated', 'Boolean', from, { optional: true } );
	if ( options && options.hasEvents )
	{
		this.createParam ( table, 'clickEvent', 'RawMessageEvent', from, { optional: true, items: ['run_command','suggest_command','open_url'] } );
		this.createParam ( table, 'hoverEvent', 'RawMessageEvent', from, { optional: true, items: ['show_text','show_item','show_achievement'] } );
	}
	if ( options && options.isRoot )
		this.createParam ( table, 'extra', 'RawMessageExtras', from, { optional: true, hasEvents: options && options.hasEvents } );
}

ParamRawMessage.prototype = new Param ( );

ParamRawMessage.prototype.update = function ( )
{
	for ( var i = 0; i < this.paramsOrdered.length; i++ )
	{
		param = this.paramsOrdered[i]

		if ( param.group !== undefined && param.groupIndex !== undefined && !this.groupRadioSelected ( param.group, param.groupIndex ) )
		{
			if ( param.value.setError )
				param.value.setError ( false );
			continue;
		}
		
		param.value.update ( );
	}
}

ParamRawMessage.prototype.toString = function ( previous )
{
	var items = [];
	var hasText = false
	
	for ( var i = 0; i < this.paramsOrdered.length; i++ )
	{
		var param = this.paramsOrdered[i];

		if ( param.group !== undefined && param.groupIndex !== undefined && !this.groupRadioSelected ( param.group, param.groupIndex ) )
			continue;
		
		var name = param.name;
		var value = param.value.toString ( ( name == 'extra' ? this.params : null ) );
		
		if ( previous instanceof Object )
		{
			if ( param.value instanceof ParamBoolean && previous[name] )
			{
				if ( param.value.checked == previous[name].value.checked )
					value = ''
				else if ( value == '' )
					value = 'false'
			}
			else if ( name == 'color' )
			{
				if ( value == previous[name].value )
					value = ''
			}
		}
		
		if ( name == 'text' && value !== '' )
			hasText = value
		
		if ( value != '' )
			items.push ( name + ':' + value );
	}
	
	if ( items.length == 1 && hasText !== false )
	{
		return hasText
	}
	
	items = items.join(',')
	
	return items == '' ? '' : '{' + items + '}'
}

function ParamRawMessageEvent ( container, from, options )
{
	this.init ( container, '', options );
	
	this.param = from && form.param
	
	this.createHTML ( container )

	//this.addItem ( );
}

ParamRawMessageEvent.prototype = new Param ( );

ParamRawMessageEvent.prototype.createHTML = function ( container )
{
	var table, row, cell, selector, option, optionsContainer;
	
	table = document.createElement ( 'table' );
	container.appendChild ( table );
	
	row = document.createElement ( 'tr' );
	table.appendChild ( row );
	
	cell = document.createElement ( 'th' );
	cell.appendChild ( document.createTextNode ( 'action' ) );
	row.appendChild ( cell );
	
	cell = document.createElement ( 'td' );
	row.appendChild ( cell );

	selector = document.createElement ( 'select' );
	selector.className = 'mc-event-selector';
	selector.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onSelectorChange ( e ) } } ) ( this ) );
	cell.appendChild ( selector );

	if ( this.options.optional )
	{
		option = document.createElement ( 'option' );
		option.value = '';
		option.appendChild ( document.createTextNode ( 'None' ) );
		selector.appendChild ( option );
	}
	
	var items = this.options && this.options.items || [];
	for ( var i = 0; i < items.length; i++ )
	{
		option = document.createElement ( 'option' );
		option.appendChild ( document.createTextNode ( items[i] ) );
		selector.appendChild ( option );
	}
	
	row = document.createElement ( 'tr' );
	table.appendChild ( row );
	
	cell = document.createElement ( 'th' );
	cell.appendChild ( document.createTextNode ( 'value' ) );
	row.appendChild ( cell );
	
	cell = document.createElement ( 'td' );
	row.appendChild ( cell );

	optionsContainer = document.createElement ( 'table' );
	optionsContainer.className = 'mc-event-options';
	cell.appendChild ( optionsContainer );

	this.selector = selector;
	this.optionsContainer = optionsContainer;
}

ParamRawMessageEvent.prototype.onSelectorChange = function ( e )
{
	e = e || window.event;
	var target = e.target || e.srcElement;

	var param = target.value;

	this.updateParam ( param );

	updateCommand ( );
}

ParamRawMessageEvent.prototype.updateParam = function ( param )
{
	var optionsContainer = this.optionsContainer;

	optionsContainer.innerHTML = '';

	this.selector.value = param;
	
	switch ( param )
	{
		case '':
			this.param = null
		break
		case 'run_command':
		case 'suggest_command':
			this.param = new params['CommandSelector'] ( optionsContainer, this.param, { quote: true } );
		break
		case 'open_url':
			this.param = new params['Text'] ( optionsContainer, this.param, { quote: true } );
		break
		case 'show_text':
			this.param = new params['RawMessage'] ( optionsContainer, this.param );
		break
		case 'show_item':
			this.param = new params['ItemTag'] ( optionsContainer, this.param );
		break
		case 'show_achievement':
			this.param = new params['Achievement'] ( optionsContainer, this.param );
		break
	}
}

ParamRawMessageEvent.prototype.update = function ( )
{
	if ( this.param )
		this.param.update ( );
}

ParamRawMessageEvent.prototype.toString = function ( )
{
	if ( !this.param )
		return '';
		
	var value = this.param.toString ( );
	
	if ( value !== '' )
		return '{action:' + this.selector.value + ',value:' + value + '}'
	
	return '';
}

function ParamRawMessageExtras ( container, from, options )
{
	this.init ( container, '', options );
	
	this.paramsOrdered = [];

	var table = document.createElement ( 'table' );
	container.appendChild ( table );
	
	this.table = table;

	var button = document.createElement ( 'button' );
	button.appendChild ( document.createTextNode ( 'Add Extra' ) );
	button.addEventListener ( 'click', ( function ( param ) { return function ( e ) { param.onAddButtonClick ( e ) } } ) ( this ) );
	container.appendChild ( button );

	//this.addItem ( );
}

ParamRawMessageExtras.prototype = new Param ( );

ParamRawMessageExtras.prototype.addItem = function ( )
{
	var row = document.createElement ( 'tr' );
	
	var cell = document.createElement ( 'td' );
	row.appendChild ( cell );

	var remove = document.createElement ( 'span' );
	remove.appendChild ( document.createTextNode ( 'Remove' ) );
	remove.addEventListener ( 'click', ( function ( tag, parent ) { return function ( e ) { tag.onRemoveClick ( e, parent ) } } ) ( this, row ) );
	cell.appendChild ( remove );

	this.table.appendChild ( row );

	if ( params['RawMessage'] == null  )
		throw new Error ( 'Missing param function RawMessage' )
	else if ( typeof params['RawMessage'] !== 'function' )
		throw new Error ( 'Invalid param function RawMessage' )
		
	//console.log ( 'ParamRawMessage' );
	var value = new params['RawMessage'] ( cell, null, { hasEvents: this.options && this.options.hasEvents } );

	this.paramsOrdered.push ( {
		value: value,
		container: row
	} );

	updateCommand ( );
}

ParamRawMessageExtras.prototype.onRemoveClick = onRemoveClick;

ParamRawMessageExtras.prototype.onAddButtonClick = function ( e )
{
	e = e || window.event;
	var target = e.target || e.srcElement;

	if ( e.preventDefault )
		e.preventDefault ( );

	this.addItem ( );

	return false;
}

ParamRawMessageExtras.prototype.update = function ( )
{
	for ( var i = 0; i < this.paramsOrdered.length; i++ )
	{
		this.paramsOrdered[i].value.update ( );
	}
}

ParamRawMessageExtras.prototype.toString = function ( previous )
{
	var items = [];
	
	for ( var i = 0; i < this.paramsOrdered.length; i++ )
	{
		var param = this.paramsOrdered[i];
		
		var value = param.value.toString ( i === 0 ? previous : this.paramsOrdered[i - 1].value.params );
		
		if ( value != '' )
			items.push ( value );
	}
	
	items = items.join(',')
	
	return items == '' ? '' : '[' + items + ']'
}

function ParamScoreboardObjectives ( container, from, options )
{
	this.init ( container, '', options );
	
	var options = document.createElement ( 'table' );
	options.className = 'mc-scoreboard-options';
	container.appendChild ( options );

	this.createParam ( container, 'list | add | remove | setdisplay', 'Select', from, { items: ['list','add','remove','setdisplay'] } );
}

ParamScoreboardObjectives.prototype = new Param ( );

function ParamScoreboardPlayers ( container, from, options )
{
	this.init ( container, '', options );
	
	var options = document.createElement ( 'table' );
	options.className = 'mc-scoreboard-options';
	container.appendChild ( options );

	this.createParam ( container, 'set | add | remove | reset | list', 'Select', from, { items: ['set','add','remove','reset','list'] } );
}

ParamScoreboardPlayers.prototype = new Param ( );

function ParamScoreboardTeams ( container, from, options )
{
	this.init ( container, '', options );
	
	var options = document.createElement ( 'table' );
	options.className = 'mc-scoreboard-options';
	container.appendChild ( options );

	this.createParam ( container, 'list | add | remove | empty | join | leave | option', 'Select', from, { items: ['list','add','remove','empty','join','leave','option'] } );
}

ParamScoreboardTeams.prototype = new Param ( );

function ParamStatic ( container, from, options )
{
	this.init ( container, '', options );
	
	this.value = options.defaultValue;

	container.appendChild ( document.createTextNode ( options.defaultValue ) );
}

ParamStatic.prototype = new Param ( );

function ParamText ( container, from, options )
{
	this.init ( container, '', options );
	
	this.value = from && from.value || '';

	var input = document.createElement ( 'input' );
	if ( options && options.defaultValue )
		input.placeholder = options.defaultValue;
	input.value = this.value;
	input.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onValueChange ( e ) } } ) ( this ) );
	container.appendChild ( input );
	
	if ( options && options.hasSpecial )
	{
		var span = document.createElement ( 'span' );
		span.className = 'input-button';
		span.appendChild ( document.createTextNode ( '§' ) )
		span.addEventListener ( 'click', ( function ( param ) { return function ( e ) { param.onSpecialClick ( e ) } } ) ( this ) );
		container.appendChild ( span );
	}

	this.input = input;
}

ParamText.prototype = new Param ( );

ParamText.prototype.onSpecialClick = function ( )
{
	var input = this.input;

	input.focus ( );

	var selStart = input.selectionStart;
	var selStop = input.selectionEnd || selStart;
    var value = input.value;

    input.value = value.slice(0, selStart) + '§' + value.slice(selStop);

	input.selectionStart = selStart + 1;
	input.selectionEnd = selStart + 1;

	input.focus ( );
}

var ParamSound = ParamText;

function ParamNumber ( container, from, options )
{
	this.init ( container, '', options );
	
	this.value = from && from.value ? from.value : '';

	var input = document.createElement ( 'input' );
	if ( options && options.isRange )
		input.type = 'number'
	else
		input.type = 'number'
	if ( options && options.min != null )
		input.min = options.min;
	if ( options && options.max != null )
		input.max = options.max;
	if ( options && options.isFloat != null )
		input.step = 0.1;
	if ( options && options.defaultValue != null )
		input.placeholder = options.defaultValue;
	input.value = this.value;
	input.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onValueChange ( e ) } } ) ( this ) );
	container.appendChild ( input );

	this.input = input;
}

ParamNumber.prototype = new Param ( );

ParamNumber.prototype.update = function ( nextHasValue )
{
	this.setError ( false );

	var required = !this.options.optional || nextHasValue || false;

	if ( required && this.value === '' && this.options.defaultValue == undefined )
		this.setError ( true );

	if ( this.input.className === '' && this.value !== '' && isNaN ( parseInt ( this.value ) ) )
		this.setError ( true );

	if ( this.input.className === '' && this.value !== '' && this.options && this.options.max && parseInt ( this.value ) > this.options.max )
		this.setError ( true );

	if ( this.input.className === '' && this.value !== '' && this.options && this.options.min && parseInt ( this.value ) < this.options.min )
		this.setError ( true );

	if ( this.input.className === '' && this.value !== '' && ( !this.options || !this.options.isFloat ) && parseInt ( this.value ) != this.value )
		this.setError ( true );

	if ( this.input.className === '' && this.value !== '' && ( this.options && this.options.isFloat ) && parseFloat ( this.value ) != this.value )
		this.setError ( true );
}

function ParamXP ( container, from, options )
{
	this.init ( container, '', options );
	
	this.isLevels = from && from.isLevels ? from.isLevels : false;
	this.value = from && from.value ? from.value : '';

	var input = document.createElement ( 'input' );
	input.type = 'number'
	if ( options && options.defaultValue !== undefined )
		input.placeholder = options.defaultValue;
	input.value = this.value;
	input.min = 0;
	input.max = 2147483647;
	input.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onValueChange ( e ) } } ) ( this ) );
	container.appendChild ( input );

	this.input = input;

	var input = document.createElement ( 'input' );
	input.type = 'checkbox'
	input.checked = this.isLevels;
	input.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onCheckChange ( e ) } } ) ( this ) );
	container.appendChild ( input );
	container.appendChild ( document.createTextNode ( ' Levels' ) );
}

ParamXP.prototype = new Param ( );

ParamXP.prototype.onCheckChange = function ( e )
{
	e = e || window.event;
	var target = e.target || e.srcElement;

	this.isLevels = target.checked;

	if ( this.isLevels )
		this.input.removeAttribute ( 'min' )
	else
		this.input.setAttribute ( 'min', 0 )

	updateCommand ( );
}

ParamXP.prototype.update = function ( nextHasValue )
{
	this.setError ( false );

	var required = !this.options.optional || nextHasValue || false;

	if ( required && this.value === '' )
		this.setError ( true );

	if ( this.input.className === '' && this.value !== '' && isNaN ( parseInt ( this.value ) ) )
		this.setError ( true );

	if ( this.input.className === '' && this.value !== '' && parseInt ( this.value ) != this.value )
		this.setError ( true );

	if ( this.input.className === '' && this.value !== '' && !this.isLevels && parseInt ( this.value ) < 0 )
		this.setError ( true );
}

ParamXP.prototype.toString = function ( )
{
	return this.value + ( this.isLevels ? 'L' : '' );
}

function PlayerUsername ( container, optional, from )
{
	var row = document.createElement ( 'tr' );

	var title = document.createElement ( 'th' );
	title.appendChild ( document.createTextNode ( 'Username' ) );
	row.appendChild ( title );

	var cell = document.createElement ( 'td' );

	if ( params['Text'] == null  )
		throw new Error ( 'Missing param function Text' )
	else if ( typeof params['Text'] !== 'function' )
		throw new Error ( 'Invalid param function Text' )
		
	//console.log ( 'ParamText' );
	this.param = new params['Text'] ( cell, '', optional, from && from.param );
	row.appendChild ( cell );
	
	if ( from && from instanceof PlayerSelector )
		this.param.setValue ( from.toString ( ) )

	container.appendChild ( row );
}

PlayerUsername.prototype.update = function ( nextHasValue )
{
	return this.param.update ( nextHasValue );
}

PlayerUsername.prototype.toString = function ( )
{
	return this.param.toString ( );
}

function PlayerSelector ( container, type, optional, from )
{
	this.init ( container, '', {} )
	
	this.defaultParamOptions = {
		nameBorder: false,
		optional: true,
		ignoreValue: false,
		ignoreIfHidden: true,
		neverRequireValue: false
	}
	
	this.type = type;
	this.params = [];

	from = from && from.paramsOrdered;

	this.createParam ( container, 'x', 'Pos', from, { optional: true } );
	this.createParam ( container, 'y', 'Pos', from, { optional: true, height:true } );
	this.createParam ( container, 'z', 'Pos', from, { optional: true } );
	this.createParam ( container, 'r', 'Number', from, { optional: true } );
	this.createParam ( container, 'rm', 'Number', from, { optional: true } );
	this.createParam ( container, 'm', 'Number', from, { optional: true } );
	this.createParam ( container, 'c', 'Number', from, { optional: true } );
	this.createParam ( container, 'l', 'Number', from, { optional: true } );
	this.createParam ( container, 'lm', 'Number', from, { optional: true } );
	//this.createParam ( container, 'team', 'Text', from, { optional: true } );
	//this.createParam ( container, 'name', 'Text', from, { optional: true } );

	var row = document.createElement ( 'tr' );

	var title = document.createElement ( 'th' );
	row.appendChild ( title );

	var cell = document.createElement ( 'td' );

	var button = document.createElement ( 'button' );
	button.appendChild ( document.createTextNode ( 'Add Name' ) );
	button.addEventListener ( 'click', ( function ( playerSelector ) { return function ( e ) { playerSelector.onAddNameClick ( e ) } } ) ( this ) );
	cell.appendChild ( button );

	var button = document.createElement ( 'button' );
	button.appendChild ( document.createTextNode ( 'Add Team' ) );
	button.addEventListener ( 'click', ( function ( playerSelector ) { return function ( e ) { playerSelector.onAddTeamClick ( e ) } } ) ( this ) );
	cell.appendChild ( button );

	var button = document.createElement ( 'button' );
	button.appendChild ( document.createTextNode ( 'Add Score Min' ) );
	button.addEventListener ( 'click', ( function ( playerSelector ) { return function ( e ) { playerSelector.onAddScoreMinClick ( e ) } } ) ( this ) );
	cell.appendChild ( button );

	var button = document.createElement ( 'button' );
	button.appendChild ( document.createTextNode ( 'Add Score Max' ) );
	button.addEventListener ( 'click', ( function ( playerSelector ) { return function ( e ) { playerSelector.onAddScoreMaxClick ( e ) } } ) ( this ) );
	cell.appendChild ( button );

	row.appendChild ( cell );

	container.appendChild ( row );

	if ( from )
	{
		var nameIndex = 0;
		var teamIndex = 0;
		var scoreIndex = 0;
		var scoreMinIndex = 0;

		for ( var i = 0; i < from.length; i++ )
		{
			if ( typeof from[i].name == 'string' && from[i].name == 'name' )
			{
				this.createParam ( container, 'name', 'Text', from, { optional: true, remove: true } );
			}
			else if ( typeof from[i].name == 'string' && from[i].name == 'team' )
			{
				this.createParam ( container, 'team', 'Text', from, { optional: true, remove: true } );
			}
			else if ( typeof from[i].name !== 'string' && from[i].name.prefix == 'score_' )
			{
				if ( from[i].name.suffix && from[i].name.suffix == '_min' )
					this.createParam ( container, {prefix: 'score_', suffix: '_min'}, 'Text', from, { optional: true, remove: true } );
				else
					this.createParam ( container, {prefix: 'score_'}, 'Text', from, { optional: true, remove: true } );
			}
		}
	}
}

PlayerSelector.prototype = new Param ( )

PlayerSelector.prototype.onAddNameClick = function ( )
{
	this.createParam ( this.container, 'name', 'Text', null, { optional: true, remove: true } );
	
	updateCommand ( );
}

PlayerSelector.prototype.onAddTeamClick = function ( )
{
	this.createParam ( this.container, 'team', 'Text', null, { optional: true, remove: true } );
	
	updateCommand ( );
}

PlayerSelector.prototype.onAddScoreMinClick = function ( )
{
	this.createParam ( this.container, {prefix: 'score_', suffix: '_min'}, 'Text', null, { optional: true, remove: true } );
	
	updateCommand ( );
}

PlayerSelector.prototype.onAddScoreMaxClick = function ( )
{
	this.createParam ( this.container, {prefix: 'score_'}, 'Text', null, { optional: true, remove: true } );
	
	updateCommand ( );
}

PlayerSelector.prototype.onRemoveClick = onRemoveClick;

PlayerSelector.prototype.update = function ( )
{
	for ( var i = 0; i < this.params.length; i++ )
	{
		this.params[i].value.update ( false );
	}
}

PlayerSelector.prototype.toString = function ( )
{
	var output = this.type;

	var params = [];

	for ( var i = 0; i < this.paramsOrdered.length; i++ )
	{
		var name = this.paramsOrdered[i].name;
		
		if ( typeof name != 'string' )
		{
			if ( name.input.value == '' )
				continue;
				
			name = ( name.prefix || '' ) + name.input.value + ( name.suffix || '' )
		}
			
		var value = this.paramsOrdered[i].value.toString ( );
		
		if ( value !== '' || name === 'team' )
			params.push ( name + '=' + value );
	}

	return output + ( params.length ? '[' + params.join(',') + ']' : '' );
}

/* Extra Structures */

function StructureInventory ( )
{
	this.structure = {
		'Items': {
			type: 'List',
			options: {
				type: 'Item',
				options: {
					count: true,
					slot: true
				}
				/*type: 'Compound',
				options: {
					'Slot': 'Byte',
					'id': 'Short',
					'Damage': 'Short',
					'Count': 'Byte',
					'tag': {
						type: 'Compound',
						options: (new structures['Item'] ( )).structure
					}
				}*/
			}
		}
	};
}

function StructureMobSpawner ( )
{
	this.structure = {
		'SpawnCount': 'Short',
		'SpawnRange': 'Short',
		'Delay': 'Short',
		'MinSpawnDelay': 'Short',
		'MaxSpawnDelay': 'Short',
		'MaxNearbyEntities': 'Short',
		'RequiredPlayerRange': 'Short',
		'EntityId': {
			type: 'Entity',
			options: {
				textOnly: true
			}
		},
		'SpawnData': {
			type: 'Compound',
			options: {
				structure: (new structures['Entity'] ( )).structure
			}
		},
		'SpawnPotentials': {
			type: 'List',
			options: {
				type: 'Entity',
				options: {
					mobSpawnerPotentials: true
				}
			}
		}
	};
}

/* Block Structures */

function StructureBlock ( )
{
	this.structure = {}
}

function StructureBlockNameable ( )
{
	this.structure = (new structures['Block'] ( )).structure;
	
	this.structure['CustomName'] = 'String'
}

function StructureBlockBeacon ( )
{
	this.structure = (new structures['Block'] ( )).structure;
	
	this.structure['Levels'] = 'Int'
	this.structure['Primary'] = 'Potion'
	this.structure['Secondary'] = 'Potion'
}

function StructureBlockCauldron ( )
{
	this.structure = (new structures['BlockNameable'] ( )).structure;
	this.structure['Items'] = (new structures['Inventory'] ( )).structure['Items'];
	
	this.structure['Items'].options.maxCount = 3;
	this.structure['Items'].options.options.slotCount = 2;
	
	this.structure['BrewTime'] = 'Int'
}

function StructureBlockChest ( )
{
	this.structure = (new structures['BlockNameable'] ( )).structure;
	this.structure['Items'] = (new structures['Inventory'] ( )).structure['Items'];
	
	this.structure['Items'].options.maxCount = 27;
	this.structure['Items'].options.options.slotCount = 26;
}

function StructureBlockComparator ( )
{
	this.structure = (new structures['Block'] ( )).structure;
	
	this.structure['OutputSignal'] = 'Int'
}

function StructureBlockControl ( )
{
	this.structure = (new structures['BlockNameable'] ( )).structure;
	
	this.structure['Command'] = 'String'
	this.structure['SuccessCount'] = 'Int'
}

function StructureBlockFurnace ( )
{
	this.structure = (new structures['BlockNameable'] ( )).structure;
	
	this.structure['BurnTime'] = 'Short'
	this.structure['CookTime'] = 'Short'
	
	this.structure['Items'] = (new structures['Inventory'] ( )).structure['Items'];
	
	this.structure['Items'].options.maxCount = 3;
	this.structure['Items'].options.options.slotCount = 2;
}

function StructureBlockHopper ( )
{
	this.structure = (new structures['BlockNameable'] ( )).structure;
	
	this.structure['Items'] = (new structures['Inventory'] ( )).structure['Items'];
	
	this.structure['Items'].options.maxCount = 5;
	this.structure['Items'].options.options.slotCount = 4;
	
	this.structure['TransferCooldown'] = 'Int'
}

function StructureBlockMobSpawner ( )
{
	this.structure = (new structures['Block'] ( )).structure;
	this.structure = mergeObjects ( this.structure, (new structures['MobSpawner'] ( )).structure );
}

function StructureBlockMusic ( )
{
	this.structure = (new structures['Block'] ( )).structure;
	
	this.structure['note'] = 'Byte'
}

function StructureBlockPiston ( )
{
	this.structure = (new structures['Block'] ( )).structure;
	
	this.structure['blockId'] = 'Int'
	this.structure['blockData'] = 'Int'
	this.structure['facing'] = 'Int'
	this.structure['progress'] = 'Float'
	this.structure['extending'] = 'Boolean'
}

function StructureBlockRecordPlayer ( )
{
	this.structure = (new structures['Block'] ( )).structure;
	
	this.structure['Record'] = 'Int'
	this.structure['RecordItem'] = 'Item'
}

function StructureBlockSign ( )
{
	this.structure = (new structures['Block'] ( )).structure;
	
	this.structure['Text1'] = 'String'
	this.structure['Text2'] = 'String'
	this.structure['Text3'] = 'String'
	this.structure['Text4'] = 'String'
}

function StructureBlockSkull ( )
{
	this.structure = (new structures['Block'] ( )).structure;
	
	this.structure['SkullType'] = 'Byte'
	this.structure['ExtraType'] = 'String'
	this.structure['Rot'] = 'Byte'
}

function StructureBlockTrap ( )
{
	this.structure = (new structures['BlockNameable'] ( )).structure;
	
	this.structure['Items'] = (new structures['Inventory'] ( )).structure['Items'];
	
	this.structure['Items'].options.maxCount = 9;
	this.structure['Items'].options.options.slotCount = 8;
}

/* Item Structures */

function StructureItem ( )
{
	this.structure = {}
	
	this.structure['ench'] = {
		type: 'List',
		options: {
			type: 'Compound',
			options: {
				structure: {
					'id': 'Enchantment',
					'lvl': 'Short'
				}
			}
		}
	}
	
	this.structure['StoredEnchantments'] = {
		type: 'List',
		options: {
			type: 'Compound',
			options: {
				structure: {
					'id': 'Enchantment',
					'lvl': 'Short'
				}
			}
		}
	}
	
	this.structure['RepairCost'] = 'Int'

	this.structure['display'] = {
		type: 'Compound',
		options: {
			structure: {
				'Name': 'String',
				'Lore': {
					type: 'List',
					options: 'String'
				}
			}
		}
	}
}

function StructureItemBookAndQuill ( )
{
	this.structure = (new structures['Item'] ( )).structure;

	this.structure.pages = {
		type: 'List',
		options: 'String'
	};
}

function StructureItemWrittenBook ( )
{
	this.structure = (new structures['ItemBookAndQuill'] ( )).structure;

	this.structure.title = 'String'
	this.structure.author = 'String'
}

function StructureItemColourable ( )
{
	this.structure = (new structures['Item'] ( )).structure;

	this.structure.display.color = 'RGB'
}

function StructureItemPotion ( )
{
	this.structure = (new structures['Item'] ( )).structure;

	this.structure.CustomPotionEffects = {
		type: 'List',
		options: {
			type: 'Compound',
			options: {
				structure: {
					'Id': 'Byte',
					'Amplifier': 'Byte',
					'Duration': 'Int',
					'Ambient': 'Boolean'
				}
			}
		}
	};
}

function StructureItemSkull ( )
{
	this.structure = (new structures['Item'] ( )).structure;

	this.structure.SkullOwner = 'String';
}

function StructureItemFireworkCharge ( )
{
	this.structure = (new structures['Item'] ( )).structure;
	
	this.structure['Explosion'] = {
		type: 'Compound',
		options: {
			structure: {
				'Flicker': 'Boolean',
				'Trail': 'Boolean',
				'Type': 'Byte',
				'Colors': {
					type: 'List',
					options: 'Int'
				},
				'FadeColors': {
					type: 'List',
					options: 'Int'
				}
			}
		}
	};
}

function StructureItemFirework ( )
{
	this.structure = (new structures['Item'] ( )).structure;

	this.structure['Fireworks'] = {
		type: 'Compound',
		options: {
			structure: {
				'Flight': 'Byte',
				'Explosions': {
					type: 'List',
					options: (new structures['ItemFireworkCharge'] ( )).structure['Explosion']
				}
			}
		}
	};
}

/* Entity Structures */

function StructureEntity ( )
{
	this.structure = {
		'Motion': {
			type: 'List',
			options: {
				type: 'Double',
				count: 3,
				noneOrAll: true,
				options: {
					defaultValue: 0
				}
			}
		},
		'Rotation': {
			type: 'List',
			options: {
				type: 'Float',
				count: 2,
				noneOrAll: true
			}
		},
		'FallDistance': 'Float',
		'Fire': 'Short',
		'Air': 'Short',
		'OnGround': 'Boolean',
		'Dimension': 'Int',
		'Invulnerable': 'Boolean',
		'PortalCooldown': 'Int',
		'UUIDMost': 'Long',
		'UUIDLeast': 'Long',
		'Riding': 'Entity'
	};
}

function StructureEntityFull ( )
{
	this.structure = (new structures['Entity'] ( )).structure;
	
	this.structure['id'] = 'String';
	this.structure['Pos'] = {
		type: 'List',
		options: {
			type: 'Double',
			count: 3
		}
	}
}

/* Mob Entity Structures */

function StructureEntityMob ( )
{
	this.structure = (new structures['Entity'] ( )).structure;
	
	this.structure['Health'] = 'Float'
	this.structure['HealF'] = 'Float'
	this.structure['AbsorptionAmount'] = 'Float'
	this.structure['AttackTime'] = 'Short'
	this.structure['HurtTime'] = 'Short'
	this.structure['DeathTime'] = 'Short'
	
	this.structure['Attributes'] = {
		type: 'List',
		options: {
			type: 'Compound'
		}
	}
	
	this.structure['ActiveEffects'] = {
		type: 'List',
		options: {
			type: 'Compound',
			options: {
				structure: {
					'Id': 'Byte',
					'Amplifier': 'Byte',
					'Duration': 'Int',
					'Ambient': 'Boolean'
				}
			}
		}
	}
	
	this.structure['Equipment'] = {
		type: 'List',
		options: {
			type: 'Item',
			count: 5,
			options: {
				count: true
			}
		}
	}
	
	this.structure['DropChance'] = {
		type: 'List',
		options: {
			type: 'Float',
			count: 5
		}
	}
	
	this.structure['CanPickUpLoot'] = 'Boolean'
	this.structure['PersistenceRequired'] = 'Boolean'
	this.structure['CustomName'] = 'String'
	this.structure['CustomNameVisible'] = 'Boolean'
	this.structure['Leashed'] = 'Boolean'
	this.structure['Leash'] = {
		type: 'Compound',
		options: {
			structure: {
				'UUIDMost': 'Long',
				'UUIDLeast': 'Long',
				'X': 'Int',
				'Y': 'Int',
				'Z': 'Int'
			}
		}
	}
}

function StructureEntityMobBreedable ( )
{
	this.structure = (new structures['EntityMob'] ( )).structure;
	this.structure['InLove'] = 'Int'
	this.structure['Age'] = 'Int'
}

function StructureEntityMobOwnable ( )
{
	this.structure = (new structures['EntityMobBreedable'] ( )).structure;
	this.structure['Owner'] = 'String'
	this.structure['Sitting'] = 'Boolean'
}

function StructureEntityMobBat ( )
{
	this.structure = (new structures['EntityMob'] ( )).structure;
	this.structure['BatFlags'] = 'Byte'
}

function StructureEntityMobCreeper ( )
{
	this.structure = (new structures['EntityMob'] ( )).structure;
	this.structure['powered'] = 'Boolean'
	this.structure['ExplosionRadius'] = 'Byte'
	this.structure['Fuse'] = 'Short'
	this.structure['ignited'] = 'Boolean'
}

function StructureEntityMobEnderman ( )
{
	this.structure = (new structures['EntityMob'] ( )).structure;
	this.structure['carried'] = 'Short'
	this.structure['carriedData'] = 'Short'
}

function StructureEntityMobHorse ( )
{
	this.structure = (new structures['EntityMobBreedable'] ( )).structure;
	this.structure['Bred'] = 'Boolean'
	this.structure['ChestedHorse'] = 'Boolean'
	this.structure['EatingHaystack'] = 'Boolean'
	this.structure['HasReproduced'] = 'Boolean'
	this.structure['Tame'] = 'Boolean'
	this.structure['Temper'] = 'Int'
	this.structure['Type'] = 'Int'
	this.structure['Variant'] = 'Int'
	this.structure['OwnerName'] = 'String'
	this.structure['Items'] = (new structures['Inventory'] ( )).structure['Items'];
	this.structure['Item'] = {
		type: 'Item',
		options: {
			count: true
		}
	}
	this.structure['SaddleItem'] = {
		type: 'Item',
		options: {
			count: true
		}
	}
}

function StructureEntityMobGhast ( )
{
	this.structure = (new structures['EntityMob'] ( )).structure;
	this.structure['ExplosionPower'] = 'Int'
}

function StructureEntityMobOzelot ( )
{
	this.structure = (new structures['EntityMobOwnable'] ( )).structure;
	this.structure['CatType'] = 'Int'
}

function StructureEntityMobPig ( )
{
	this.structure = (new structures['EntityMobBreedable'] ( )).structure;
	this.structure['Saddle'] = 'Boolean'
}

function StructureEntityMobSheep ( )
{
	this.structure = (new structures['EntityMobBreedable'] ( )).structure;
	this.structure['Sheared'] = 'Boolean'
	this.structure['Color'] = 'Byte'
}

function StructureEntityMobSkeleton ( )
{
	this.structure = (new structures['EntityMob'] ( )).structure;
	this.structure['SkeletonType'] = 'Byte'
}

function StructureEntityMobSlime ( )
{
	this.structure = (new structures['EntityMob'] ( )).structure;
	this.structure['Size'] = 'Byte'
}

function StructureEntityMobWitherBoss ( )
{
	this.structure = (new structures['EntityMob'] ( )).structure;
	this.structure['Invul'] = 'Int'
}

function StructureEntityMobWolf ( )
{
	this.structure = (new structures['EntityMobOwnable'] ( )).structure;
	this.structure['Angry'] = 'Byte'
	this.structure['CollarColor'] = 'Byte'
}

function StructureEntityMobVillager ( )
{
	this.structure = (new structures['EntityMob'] ( )).structure;
	this.structure['Profession'] = 'Int'
	this.structure['Riches'] = 'Int'
	this.structure['Offers'] = {
		type: 'Compound',
		options: {
			structure: {
				'Recipes': {
					type: 'List',
					options: {
						type: 'Compound',
						options: {
							structure: {
								'maxUses': 'Int',
								'uses': 'Int',
								'buy': {
									type: 'Item',
									options: {
										count: true
									}
								},
								'buyB': {
									type: 'Item',
									options: {
										count: true
									}
								},
								'sell': {
									type: 'Item',
									options: {
										count: true
									}
								}
							}
						}
					}
				}
			}
		}
	}
}

function StructureEntityMobVillagerGolem ( )
{
	this.structure = (new structures['EntityMob'] ( )).structure;
	this.structure['PlayerCreated'] = 'Boolean'
}

function StructureEntityMobZombie ( )
{
	this.structure = (new structures['EntityMob'] ( )).structure;
	this.structure['IsVillager'] = 'Boolean'
	this.structure['IsBaby'] = 'Boolean'
	this.structure['ConversionTime'] = 'Int'
}

function StructureEntityMobPigZombie ( )
{
	this.structure = (new structures['EntityMobZombie'] ( )).structure;
	this.structure['Anger'] = 'Short'
}

/* Projectile Entity Structures */

function StructureEntityProjectileGeneric ( )
{
	this.structure = mergeObjects ( {
		'xTile': 'Short',
		'yTile': 'Short',
		'zTile': 'Short',
		'inTile': 'Byte',
		'shake': 'Byte',
		'inGround': 'Byte'
	}, (new structures['Entity'] ( )).structure );
}

function StructureEntityProjectileOwned ( )
{
	this.structure = (new structures['EntityProjectileGeneric'] ( )).structure;
	this.structure['ownerName'] = 'String'
}

function StructureEntityProjectileFireballs ( )
{
	this.structure = (new structures['EntityProjectileGeneric'] ( )).structure;
	this.structure['direction'] = {
		type: 'List',
		options: 'Double'
	}
}

function StructureEntityProjectileArrow ( )
{
	this.structure = (new structures['EntityProjectileGeneric'] ( )).structure;
	this.structure['inData'] = 'Byte'
	this.structure['pickup'] = 'Byte'
	this.structure['player'] = 'Boolean'
	this.structure['damage'] = 'Double'
}

function StructureEntityProjectileFireball ( )
{
	this.structure = (new structures['EntityProjectileFireballs'] ( )).structure;
	this.structure['ExplosionPower'] = 'Int'
}

function StructureEntityProjectileThrownPotion ( )
{
	this.structure = (new structures['EntityProjectileOwned'] ( )).structure;
	this.structure['potionValue'] = 'Int'
}

/* Minecart Entity Structures */

function StructureEntityMinecart ( )
{
	this.structure = (new structures['Entity'] ( )).structure
	this.structure['CustomDisplayTile'] = 'Boolean'
	this.structure['DisplayTile'] = 'Int'
	this.structure['DisplayData'] = 'Int'
	this.structure['DisplayOffset'] = 'Int'
	this.structure['CustomName'] = 'String'
}

function StructureEntityMinecartInventory ( )
{
	this.structure = (new structures['EntityMinecart'] ( )).structure;
	this.structure['Items'] = (new structures['Inventory'] ( )).structure['Items'];
}

function StructureEntityMinecartCommandBlock ( )
{
	this.structure = (new structures['EntityMinecart'] ( )).structure;
	this.structure['Command'] = {
		type: 'CommandSelector',
		options: {
			quote: true
		}
	};
}

function StructureEntityMinecartFurnace ( )
{
	this.structure = (new structures['EntityMinecart'] ( )).structure;
	this.structure['PushX'] = 'Double'
	this.structure['PushZ'] = 'Double'
	this.structure['Fuel'] = 'Short'
}

function StructureEntityMinecartHopper ( )
{
	this.structure = (new structures['EntityMinecartInventory'] ( )).structure;
	this.structure['TransferCooldown'] = 'Int';
	this.structure['Items'].options.maxCount = 5;
	this.structure['Items'].options.options.slotCount = 4;
}

function StructureEntityMinecartTNT ( )
{
	this.structure = (new structures['EntityMinecart'] ( )).structure;
	this.structure['TNTFuse'] = 'Int';
}

function StructureEntityMinecartSpawner ( )
{
	this.structure = (new structures['EntityMinecart'] ( )).structure;
	this.structure = mergeObjects ( this.structure, (new structures['MobSpawner'] ( )).structure );
}

/* Other Entity Structures */

function StructureEntityPaintingLike ( )
{
	this.structure = (new structures['Entity'] ( )).structure;
	this.structure['TileX'] = 'Int';
	this.structure['TileY'] = 'Int';
	this.structure['TileZ'] = 'Int';
	this.structure['Direction'] = 'Byte';
}

function StructureEntityFallingSand ( )
{
	this.structure = (new structures['Entity'] ( )).structure;
	this.structure['TileID'] = 'Int';
	this.structure['TileEntityData'] = 'Compound';
	this.structure['Data'] = 'Byte';
	this.structure['Time'] = 'Byte';
	this.structure['DropItem'] = 'Boolean';
	this.structure['HurtEntities'] = 'Boolean';
	this.structure['FallHurtMax'] = 'Int';
	this.structure['FallHurtAmount'] = 'Float';
}

function StructureEntityFirework ( )
{
	this.structure = (new structures['Entity'] ( )).structure;
	this.structure['Life'] = 'Int';
	this.structure['LifeTime'] = 'Compound';
	this.structure['FireworksItem'] = {
		type: 'Item',
		options: {
			count: true
		}
	};
}

function StructureEntityItem ( )
{
	this.structure = (new structures['Entity'] ( )).structure
	this.structure.Item = {
		type: 'Item',
		options: {
			count: true
		}
	}
}

function StructureEntityItemFrame ( )
{
	this.structure = (new structures['EntityPaintingLike'] ( )).structure;
	this.structure['Item'] = {
		type: 'Item',
		options: {
			count: true
		}
	};
	this.structure['ItemDropChance'] = 'Float';
	this.structure['ItemRotation'] = 'Byte';
}

function StructureEntityPainting ( )
{
	this.structure = (new structures['EntityPaintingLike'] ( )).structure;
	this.structure['Motive'] = 'String';
}

function StructureEntityPrimedTNT ( )
{
	this.structure = (new structures['Entity'] ( )).structure;
	this.structure['Fuse'] = 'Int';
}

/* Tags */

function Tag ( )
{
}

Tag.prototype = new Param ( );

Tag.prototype.init = function ( container, description, options )
{
	var defaultOptions = {
		optional: true
	};
	
	options = mergeObjects ( options, defaultOptions );
	
	this.container = container
	
	this.description = description
	
	this.params = {};
	this.paramsOrdered = [];
	
	this.options = options;
}

Tag.prototype.onRemoveClick = onRemoveClick;

Tag.prototype.update = function ( required )
{
	if ( this.tags )
	{
		for ( var tag in this.tags )
		{
			this.tags[tag].value.update ( required );
		}
	}

	if ( this.customs )
	{
		for ( var i = 0; i < this.customs.length; i++ )
		{
			if ( this.customs[i].value )
				this.customs[i].value.update ( required );
		}
	}

	this.tag && this.tag.update ( required );
}

Tag.prototype.toString = function ( required )
{
	if ( this.hiddens || this.tags || this.customs )
	{
		var outputItems = []
		var output = '';
		
		if ( this.tags && this.tags instanceof Array )
		{
			var output = '';

			for ( var i = 0; i < this.tags.length; i++ )
			{
				var value = this.tags[i].value.toString ( );
				if ( value !== '' )
				{
					outputItems.push ( value )
				}
			}

			if ( outputItems.length )
				output = '[' + outputItems.join ( ',' ) + ']';
		}
		else
		{
			if ( this.hiddens )
			{
				for ( var tag in this.hiddens )
				{
					var value = this.hiddens[tag];
					if ( value !== '' )
					{
						outputItems.push ( tag + ':' + value )
					}
				}
			}

			if ( this.tags )
			{
				for ( var tag in this.tags )
				{
					var value = this.tags[tag].value.toString ( );
					if ( value !== '' )
					{
						outputItems.push ( tag + ':' + value )
					}
				}
			}

			if ( this.customs )
			{
				for ( var i = 0; i < this.customs.length; i++ )
				{
					if ( this.customs[i].value )
					{
						var name = this.customs[i].name.value;
						var value = this.customs[i].value.toString ( );
						if ( name !== '' )
						{
							outputItems.push ( name + ( value !== '' ? ':' + value : '' ) )
						}
					}
				}
			}

			if ( outputItems.length )
				output = '{' + outputItems.join ( ',' ) + '}';
		}

		return output;
	}
	
	return ( this.tag && this.tag.toString ( required ) ) || '';
}

function TagCompound ( container, from, options )
{
	this.init ( container, '', options );
	
	this.table = this.createTable ( container );
	
	var structure = options && options.structure;
	
	if ( typeof structure == 'string' )
	{
		if ( structures[structure] == null  )
			throw new Error ( 'Missing structure function ' + structure )
		else if ( typeof structures[structure] !== 'function' )
			throw new Error ( 'Invalid structure function ' + structure )
		
		structure = (new structures[structure]).structure;
	}

	if ( structure )
	{
		for ( var name in structure )
		{
			var tag = structure[name];
			if ( typeof tag == 'string' )
				this.createTag ( this.table, name, tag, from && from.tags && from.tags[name] && from.tags[name].value || null, { optional: true } );
			else
				this.createTag ( this.table, name, tag.type, from && from.tags && from.tags[name] && from.tags[name].value || null, tag.options );
		}
	}

	var button = document.createElement ( 'button' );
	button.appendChild ( document.createTextNode ( 'Add Tag' ) );
	button.addEventListener ( 'click', ( function ( tagCompound ) { return function ( e ) { tagCompound.onAddClick ( e ) } } ) ( this ) );
	container.appendChild ( button );
}

TagCompound.prototype = new Tag ( );

TagCompound.prototype.createTag = function ( container, name, type, from, options )
{
	var row = document.createElement ( 'tr' );

	var cell = document.createElement ( 'th' );
	cell.appendChild ( document.createTextNode ( name ) );
	row.appendChild ( cell );

	var cell = document.createElement ( 'td' );
	
	if ( tags[type] == null  )
		throw new Error ( 'Missing tag function ' + type )
	else if ( typeof tags[type] !== 'function' )
		throw new Error ( 'Invalid tag function ' + type )
		
	//console.log ( 'Tag' + type )
	var value = new tags[type] ( cell, from, options );
	
	row.appendChild ( cell );

	container.appendChild ( row );

	if ( !this.tags )
		this.tags = {};

	this.tags[name] = {
		value: value,
		container: row
	}
}

TagCompound.prototype.createTable = function ( container, remove )
{
	var table = document.createElement ( 'table' );
	table.className = 'mc-tag-options';
	container.appendChild ( table );

	return table;
}

TagCompound.prototype.onAddClick = onAddClick

TagCompound.prototype.createCustomTag = function ( container )
{
	var row = document.createElement ( 'tr' );

	var cell = document.createElement ( 'th' );
	var name = document.createElement ( 'input' );
	name.addEventListener ( 'change', ( function ( tag ) { return function ( e ) { tag.onNameChange ( e ) } } ) ( this ) );
	cell.appendChild ( name );
	row.appendChild ( cell );

	var cell = document.createElement ( 'td' );

	var remove = document.createElement ( 'span' );
	remove.appendChild ( document.createTextNode ( 'Remove' ) );
	remove.addEventListener ( 'click', ( function ( tag, parent ) { return function ( e ) { tag.onRemoveClick ( e, parent ) } } ) ( this, row ) );
	cell.appendChild ( remove );

	var value = new TagSelector ( cell );
	row.appendChild ( cell );

	container.appendChild ( row );

	if ( !this.customs )
		this.customs = [];

	this.customs.push ( {
		name: name,
		value: value,
		container: row
	} );
}

TagCompound.prototype.onNameChange = function ( e )
{
	updateCommand ( );
}

TagCompound.prototype.addItem = function ( )
{
	this.createCustomTag ( this.table );

	updateCommand ( );
}

function TagList ( container, from, options )
{
	var defaultOptions = {
		type: options,
		count: '*',
		noneOrAll: false
	}
	options = mergeObjects ( options, defaultOptions );
	
	this.init ( container, '', options )
	/*this.type = structure.type || structure;
	this.children = structure.children || null;
	this.count = structure.count || '*';
	this.noneOrAll = structure.noneOrAll || false;
	this.container = container;*/
	this.tags = [];
	
	this.div = document.createElement ( 'div' );
	container.appendChild ( this.div );
	
	if ( options.count == '*' )
	{
		var button = document.createElement ( 'button' );
		button.appendChild ( document.createTextNode ( 'Add List Item' ) );
		button.addEventListener ( 'click', ( function ( tagList ) { return function ( e ) { tagList.onAddClick ( e ) } } ) ( this ) );
		container.appendChild ( button );
	}
	
	if ( from && from.type == this.type )
	{
		var count = from.tags.length;
		if ( options.count !== '*' && count > options.count )
			count = options.count
			
		for ( var i = 0; i < count; i++ )
		{
			this.addItem ( from.tags[i].value );
		}
		//tags
	}
	
	if ( options.count !== '*' )
	{
		while ( this.tags.length < options.count )
			this.addItem ( );
	}
}

TagList.prototype = new Tag ( );

TagList.prototype.addItem = function ( from )
{
	if ( this.options.maxCount != null && this.tags.length >= this.options.maxCount )
		return;
		
	//var table = this.createTable ( this.div, true );
	var div = document.createElement ( 'div' );
	//div.className = 'mc-tag-options';

	if ( this.options.count === '*' )
	{
		var cell = document.createElement ( 'span' );
		cell.appendChild ( document.createTextNode ( 'Remove' ) );
		cell.addEventListener ( 'click', ( function ( tag, parent ) { return function ( e ) { tag.onRemoveClick ( e, parent ) } } ) ( this, div ) );
		div.appendChild ( cell );
	}

	this.div.appendChild ( div );

	if ( tags[this.options.type] == null  )
		throw new Error ( 'Missing tag function ' + this.options.type )
	else if ( typeof tags[this.options.type] !== 'function' )
		throw new Error ( 'Invalid tag function ' + this.options.type )
		
	//console.log ( 'Tag' + this.options.type );
	var value = new tags[this.options.type] ( div, from, this.options.options )

	this.tags.push ( {
		value: value,
		container: div
	} );

	updateCommand ( );
}

TagList.prototype.update = function ( )
{
	var required = false
	
	if ( this.tags )
	{
		if ( this.options.noneOrAll )
		{
			for ( var tag in this.tags )
			{
				if ( this.tags[tag].value.toString ( ) !== '' )
				{
					required = true
					break;
				}
			}
		}
	
		for ( var tag in this.tags )
		{
			this.tags[tag].value.update ( required );
		}
	}
}

TagList.prototype.toString = function ( )
{
	var required = false
	
	if ( this.tags )
	{
		if ( this.options.noneOrAll )
		{
			for ( var tag in this.tags )
			{
				if ( this.tags[tag].value.toString ( ) !== '' )
				{
					required = true
					break;
				}
			}
		}
		
		var output = [];

		for ( var i = 0; i < this.tags.length; i++ )
		{
			var value = this.tags[i].value.toString ( required );
			if ( value !== '' )
				output.push ( value )
		}

		if ( output.length )
			return '[' + output.join(',') + ']';
	}
	
	return '';
}

TagList.prototype.onAddClick = onAddClick;

function TagFloat ( container, from, options )
{
	this.init ( container, '', options );
	
	this.options.isFloat = true;
	
	this.tag = new params['Number'] ( container, from && from.tag, this.options );
}

TagFloat.prototype = new Tag ( );

TagFloat.prototype.toString = function ( required )
{
	var value = this.tag.toString ( required );
	if ( !isNaN ( parseFloat ( value ) ) )
	{
		value = parseFloat ( value ).toString ( )
		if ( value.indexOf('.') == '-1' )
			value = value + '.0'
	}

	return value;
}

function TagShort ( container, from, options )
{
	this.init ( container, '', options );
	this.tag = new params['Number'] ( container, from && from.tag, this.options );
}

TagShort.prototype = new Tag ( );

function TagString ( container, from, options )
{
	this.init ( container, '', options );
	
	this.options.hasSpecial = true;
	
	this.tag = new params['Text'] ( container, from && from.tag, this.options );
}

TagString.prototype = new Tag ( );

TagString.prototype.toString = function ( )
{
	var value = this.tag.toString ( );
	if ( value !== '' )
		value = quote ( value )

	return value;
}

function TagBoolean ( container, from, options )
{
	this.init ( container, '', options );
	
	this.options.numberOutput = true;
	
	this.tag = new params['Boolean'] ( container, from && from.tag, this.options );
}

TagBoolean.prototype = new Tag ( );

function TagCommandSelector ( container, from, options )
{
	this.init ( container, '', options );

	this.commandSelector = new CommandSelector ( container );
}

TagCommandSelector.prototype = new Tag ( );

TagCommandSelector.prototype.update = function ( )
{
	this.commandSelector.update ( );
}

TagCommandSelector.prototype.toString = function ( )
{
	var value = this.commandSelector.toString ( );
	
	if ( this.options && this.options.quote )
		value = quote ( value )
	
	return value 
}

function TagEnchantment ( container, from, options )
{
	this.init ( container, '', options );
	this.tag = new params['Enchantment'] ( container, from && from.tag, this.options );
}

TagEnchantment.prototype = new Tag ( );

function TagEntity ( container, from, options )
{
	this.init ( container, '', options );
	
	//this.selector = new params['Entity'] ( container, from && from.selector, { optional: this.options.optional } );
	this.selector = new params['Select'] ( container, from && from.selector, { optional: this.options.optional, ignoreValue: true, stringIds: true, items: entities, custom: true } );
	this.id = new params['Text'] ( container, from && from.id, { optional: this.options.optional } );
	if ( this.options.mobSpawnerPotentials )
		this.weight = new params['Number'] ( container, from && from.id, { optional: this.options.optional, min: 1, defaultValue: 1 } );
	
	var div = document.createElement ( 'div' )
	container.appendChild ( div )
	
	this.container = div;
	
	if ( !this.options.textOnly )
		this.tag = new params['DataTag'] ( div, from && from.tag, { optional: true} );
}

TagEntity.prototype = new Tag ( );

TagEntity.prototype.update = function ( )
{
	var entityName = this.selector.value;
	
	if ( entityName === 'custom' )
	{
		this.id.input.style.display = '';
	}
	else
	{
		this.id.setValue ( entityName );
		this.id.input.style.display = 'none';
	}
	
	entityName = this.id.value;
	if ( entityName == '' )
		this.container.style.display = 'none';
	else
		this.container.style.display = '';
	
	if ( !this.options.textOnly )
	{
		var entity;
		
		for ( var i = 0; i < entities.length; i++ )
		{
			entity = entities[i];
			
			if ( typeof entity !== 'string' && entity.id == entityName )
			{
				var structure = entity.structure || {}
				
				if ( structure != this.tag.type )
					this.tag.updateType ( structure )
				break
			}
		}
	}
	
	if ( !this.options.mobSpawnerPotentials && !this.options.textOnly && this.tag.tag )
	{
		this.tag.tag.hiddens = {
			id: entityName
		}
	}
	
	
	this.selector.update ( );
	this.id.update ( );
	if ( this.options.mobSpawnerPotentials )
		this.weight.update ( )
	if ( !this.options.textOnly )
		this.tag.update ( );	
}

TagEntity.prototype.toString = function ( required )
{
	if ( this.options.mobSpawnerPotentials )
	{
		var entityName = this.id.value;
		if ( entityName == '' )
			return '';
			
		var tagText = this.tag.toString ( );
			
		return '{Type:"' + entityName + '",Weight:' + this.weight.toString(true) + ( tagText != '' ? ',Properties:' + tagText : '' ) + '}'
	}
	else if ( this.options.textOnly )
		return this.id.toString ( required );
	else
		return this.tag.toString ( required )
}

function TagItem ( container, from, options )
{
	this.init ( container, '', options );
	
	var table = document.createElement ( 'table' );
	table.className = 'mc-tag-options';
	container.appendChild ( table );
	
	this.createParam ( table, 'item metadata', 'Select', from, { optional: this.options.optional, ignoreValue: true, items: items, value: '{id} {data}', custom: true,  defaultValue: this.options.defaultValue } );
	//this.createParam ( table, 'item metadata', 'Item', from, { optional: this.options.optional, defaultValue: this.options.defaultValue } );
	this.createParam ( table, 'item', 'Text', from, { optional: this.options.optional, defaultValue: 0 } );
	this.createParam ( table, 'metadata', 'Text', from, { optional: this.options.optional, defaultValue: 0 } );
	if ( this.options.count )
		this.createParam ( table, 'count', 'Number', from, { optional: this.options.optional, defaultValue: 1 } );
	if ( this.options.slot )
		this.createParam ( table, 'slot', 'Number', from, { optional: this.options.optional, defaultValue: 0, min: 0, max: options.slotCount } );
	this.createParam ( table, 'dataTag', 'DataTag', from, { optional: true } );
	
	this.tag = this.params.dataTag.value
}

TagItem.prototype = new Tag ( );

TagItem.prototype.update = function ( )
{
	var selectValue = this.params['item metadata'].value.value.toString ( );
	
	if ( selectValue === '0' )
	{
		this.params.item.container.style.display = '';
		this.params.metadata.container.style.display = '';
	}
	else
	{
		var itemMetadata = selectValue.split ( ' ' );

		this.params.item.value.setValue ( itemMetadata[0] || '' );
		this.params.item.container.style.display = 'none';
		
		if ( itemMetadata[1] !== '*' )
		{
			this.params.metadata.value.setValue ( itemMetadata[1] || '' );
			this.params.metadata.container.style.display = 'none';
		}
	}
	
	var itemId = this.params.item.value.toString ( );
	var metadata = this.params.metadata.value.toString ( );
	if ( this.params.count )
		var count = this.params.count.value.toString ( true );
	if ( this.params.slot )
		var slot = this.params.slot.value.toString ( );
	
	if ( itemId == '' )
		this.params.dataTag.container.style.display = 'none';
	else
		this.params.dataTag.container.style.display = '';
	
	var item;
	
	for ( var i = 0; i < items.length; i++ )
	{
		item = items[i];
		
		if ( item.id == itemId )
		{
			var structure = item.structure || 'Item'
			if ( structure != this.params.dataTag.value.type )
				this.params.dataTag.value.updateType ( structure )
			break
		}
	}
	
	/*if ( this.tag.tag )
	{
		if ( !this.tag.tag.hiddens || itemId == '' )
			this.tag.tag.hiddens = {};
			
		if ( itemId !== '' )
		{
			this.tag.tag.hiddens.id = itemId;
		
			if ( metadata == '0' )
				delete this.tag.tag.hiddens.Damage;
			else
				this.tag.tag.hiddens.Damage = metadata;
			if ( count !== undefined )
				this.tag.tag.hiddens.Count = count;
			if ( slot !== undefined )
				this.tag.tag.hiddens.Slot = slot;
		}
	}*/

	this.updateLoop ( );
}

TagItem.prototype.toString = function ( ) 
{
	var output = [];
	
	var itemId = this.params.item.value.toString ( );
	var metadata = this.params.metadata.value.toString ( );
	if ( this.params.count )
		var count = this.params.count.value.toString ( true );
	if ( this.params.slot )
		var slot = this.params.slot.value.toString ( );
	if ( this.params.dataTag )
		var tag = this.params.dataTag.value.toString ( );
		
	if ( itemId !== '' )
	{
		output.push ( 'id:' + itemId );
	
		if ( metadata == '0' )
			output.push ( 'Damage:' + metadata );
			
		if ( count !== undefined )
			output.push ( 'Count:' + count );
			
		if ( slot !== undefined )
			output.push ( 'Slot:' + slot );
			
		if ( tag !== '' )
			output.push ( 'tag:' + tag );
	}
	
	return output.length ? '{' + output.join(',') + '}' : '';
}

function TagReplace ( container, from, options )
{
	this.init ( container, '', options );
	this.tag = null;
	this.name = structure.name || 'Item';
	this.structure = structure.structure || {};
	this.optional = optional;
	this.container = container;
	
	if ( from && from.tag )
		this.addItem ( from.tag );
	else
	{
		var button = document.createElement ( 'button' );
		button.appendChild ( document.createTextNode ( 'Add ' + this.name ) );
		button.addEventListener ( 'click', ( function ( tag ) { return function ( e ) { tag.onAddButtonClick ( e ) } } ) ( this ) );
		this.button = button;
		container.appendChild ( button );
	}
}

TagReplace.prototype = new Tag ( );

TagReplace.prototype.onAddButtonClick = function ( e )
{
	e = e || window.event;
	var target = e.target || e.srcElement;

	if ( e.preventDefault )
		e.preventDefault ( );

	this.addItem ( );

	return false;
}

TagReplace.prototype.addItem = function ( from )
{
	if ( this.button )
		this.button.parentNode.removeChild ( this.button )
		
	this.tag = new tags['Compound'] ( this.container, this.structure, this.optional, from );
}

function TagSelector ( container )
{
	this.tag = null;

	this.createHTML ( container );

	this.tag = undefined;

	this.updateTag ( this.selector.value );
}

TagSelector.prototype = new Param ( );

TagSelector.prototype.createHTML = function ( container )
{
	var selector = document.createElement ( 'select' );
	selector.className = 'mc-tag-selector';
	selector.addEventListener ( 'change', ( function ( tagSelector ) { return function ( e ) { tagSelector.onSelectorChange ( e ) } } ) ( this ) );
	container.appendChild ( selector );

	var option = document.createElement ( 'option' );
	option.appendChild ( document.createTextNode ( 'Compound' ) );
	selector.appendChild ( option );

	var option = document.createElement ( 'option' );
	option.appendChild ( document.createTextNode ( 'List' ) );
	selector.appendChild ( option );

	var option = document.createElement ( 'option' );
	option.appendChild ( document.createTextNode ( 'Byte' ) );
	selector.appendChild ( option );

	var option = document.createElement ( 'option' );
	option.appendChild ( document.createTextNode ( 'Short' ) );
	selector.appendChild ( option );

	var option = document.createElement ( 'option' );
	option.appendChild ( document.createTextNode ( 'Int' ) );
	selector.appendChild ( option );

	var option = document.createElement ( 'option' );
	option.appendChild ( document.createTextNode ( 'Long' ) );
	selector.appendChild ( option );

	var option = document.createElement ( 'option' );
	option.appendChild ( document.createTextNode ( 'Float' ) );
	selector.appendChild ( option );

	var option = document.createElement ( 'option' );
	option.appendChild ( document.createTextNode ( 'Double' ) );
	selector.appendChild ( option );

	var option = document.createElement ( 'option' );
	option.appendChild ( document.createTextNode ( 'String' ) );
	selector.appendChild ( option );

	var options = document.createElement ( 'div' );
	options.className = 'mc-tag-options';
	container.appendChild ( options );

	this.selector = selector;
	this.options = options;
}

TagSelector.prototype.onSelectorChange = function ( e )
{
	e = e || window.event;
	var target = e.target || e.srcElement;

	var player = target.value;

	if ( !player )
		return;

	var container = target.parentNode;

	this.updateTag ( player );

	updateCommand ( );
}

TagSelector.prototype.updateTag = function ( tag )
{
	var options = this.options;

	options.innerHTML = '';

	this.selector.value = tag;

	if ( tags[tag] == null )
		throw new Error ( 'Missing tag function ' + tag )
	else if ( typeof tags[tag] !== 'function' )
		throw new Error ( 'Invalid tag function ' + tag )
		
	//console.log ( 'Tag' + tag );
	this.tag = new tags[tag] ( options );
	//this.tag = new PlayerSelector ( options, player, this.optional, this.player );
}

TagSelector.prototype.update = function ( )
{
	if ( this.tag )
		this.tag.update ( );

}

TagSelector.prototype.toString = function ( )
{
	return this.tag ? this.tag.toString ( ) : '';
}

function onGenerateClick ( e )
{
	e = e || window.event;
	if ( e.preventDefault )
		e.preventDefault ( );

	updateCommand ( )

	return false;
}

function updateCommand ( )
{
	var selector, text, reader;
	
	for ( var i = 0; i < selectors.length; i++ )
	{
		selector = selectors[i];
		text = selector.text;
		reader = selector.reader;
		
		selector.update ( );
		
		text.value = "";
		text.value = selector.toString ( );
		//text.select ( );
		
		text.className = reader.getElementsByClassName ( 'error' ).length ? 'mc-commands-text error' : 'mc-commands-text';
	}
}

function createSelector ( container )
{
	var commandReader = document.createElement ( 'div' );
	commandReader.className = 'mc-command-reader';
	container.appendChild ( commandReader );

	var commandText = document.createElement ( 'textarea' );
	commandText.className = 'mc-commands-text';
	commandText.readOnly = true;
	commandText.cols = 100;
	commandText.rows = 10;
	commandText.addEventListener ( 'click', ( function ( textarea ) { return function ( e ) { textarea.select ( ) } } ) ( commandText ) );
	container.appendChild ( commandText );

	var commandSelector = new CommandSelector ( commandReader, commandText );
	
	selectors.push ( commandSelector );

	updateCommand ( );
}

/**COMMANDS**/
commands = {
	'achievement': CommandAchievement,
	'clear': CommandClear,
	'debug': CommandDebug,
	'defaultgamemode': CommandDefaultGamemode,
	'difficulty': CommandDifficulty,
	'effect': CommandEffect,
	'enchant': CommandEnchant,
	'gamemode': CommandGamemode,
	'gamerule': CommandGameRule,
	'give': CommandGive,
	'me': CommandMe,
	//'kill': CommandKill,
	//'publish': CommandPublish,
	'playsound': CommandPlaySound,
	'say': CommandSay,
	'scoreboard': CommandScoreBoard,
	//'seed': CommandSeed,
	'setblock': CommandSetBlock,
	'spawnpoint': CommandSpawnPoint,
	'spreadplayers': CommandSpreadPlayers,
	'summon': CommandSummon,
	'tell': CommandTell,
	'tellraw': CommandTellRaw,
	'testfor': CommandTestFor,
	'testforblock': CommandTestForBlock,
	'time': CommandTime,
	'toggledownfall': CommandToggleDownFall,
	'tp': CommandTP,
	'weather': CommandWeather,
	'xp': CommandXP
};

/**PARAMS**/
params = {
	//'Achievement': ParamAchievement,
	'Boolean': ParamBoolean,
	//'Block': ParamBlock,
	'CommandSelector': ParamCommandSelector,
	'DataTag': ParamDataTag,
	//'Enchantment': ParamEnchantment,
	//'Entity': ParamEntity,
	//'Item': ParamItem,
	'Select': ParamSelect,
	'Number': ParamNumber,
	'PlayerSelector': ParamPlayerSelector,
	'Pos': ParamPos,
	//'Potion': ParamPotion,
	'RawMessage': ParamRawMessage,
	'RawMessageEvent': ParamRawMessageEvent,
	'RawMessageExtras': ParamRawMessageExtras,
	//'Sound': ParamSound,
	'Static': ParamStatic,
	'Text': ParamText,
	'XP': ParamXP
}

/**TAGS**/
tags = {
	'Compound': TagCompound,
	'List': TagList,
	
	'String': TagString,
	'Byte': TagShort,
	'Int': TagShort,
	'Short': TagShort,
	'Long': TagShort,
	'Float': TagFloat,
	'Double': TagFloat,
	
	'Boolean': TagBoolean,
	'CommandSelector': TagCommandSelector,
	'Enchantment': TagEnchantment,
	'Entity': TagEntity,
	'Item': TagItem,
	'Replace': TagReplace,
	'RGB': TagShort
}

/**STRUCTURE**/
structures = {
	'Inventory': StructureInventory,
	'MobSpawner': StructureMobSpawner,
	
	'Block': StructureBlock,
	'BlockNameable': StructureBlockNameable,
	'BlockBeacon': StructureBlockBeacon,
	'BlockCauldron': StructureBlockCauldron,
	'BlockChest': StructureBlockChest,
	'BlockComparator': StructureBlockComparator,
	'BlockControl': StructureBlockControl,
	'BlockFurnace': StructureBlockFurnace,
	'BlockHopper': StructureBlockHopper,
	'BlockMobSpawner': StructureBlockMobSpawner,
	'BlockMusic': StructureBlockMusic,
	'BlockPiston': StructureBlockPiston,
	'BlockRecordPlayer': StructureBlockRecordPlayer,
	'BlockSign': StructureBlockSign,
	'BlockSkull': StructureBlockSkull,
	'BlockTrap': StructureBlockTrap,
	
	
	'Item': StructureItem,
	'ItemBookAndQuill': StructureItemBookAndQuill,
	'ItemWrittenBook': StructureItemWrittenBook,
	'ItemColourable': StructureItemColourable,
	'ItemPotion': StructureItemPotion,
	'ItemSkull': StructureItemSkull,
	'ItemFirework': StructureItemFirework,
	'ItemFireworkCharge': StructureItemFireworkCharge,
	
	'Entity': StructureEntity,
	'EntityFull': StructureEntityFull,
	
	'EntityMob': StructureEntityMob,
	'EntityMobBreedable': StructureEntityMobBreedable,
	
	'EntityMobBat': StructureEntityMobBat,
	'EntityMobHorse': StructureEntityMobHorse,
	'EntityMobOzelot': StructureEntityMobOzelot,
	'EntityMobPig': StructureEntityMobPig,
	'EntityMobVillager': StructureEntityMobVillager,
	
	'EntityMobEnderman': StructureEntityMobEnderman,
	'EntityMobWolf': StructureEntityMobWolf,
	
	'EntityMobCreeper': StructureEntityMobCreeper,
	'EntityMobGhast': StructureEntityMobGhast,
	'EntityMobSlime': StructureEntityMobSlime,
	'EntityMobSkeleton': StructureEntityMobSkeleton,
	'EntityMobZombie': StructureEntityMobZombie,
	'EntityMobPigZombie': StructureEntityMobPigZombie,
	
	'EntityMobVillagerGolem': StructureEntityMobVillagerGolem,
	
	'EntityMobWitherBoss': StructureEntityMobWitherBoss,
	
	'EntityProjectileGeneric': StructureEntityProjectileGeneric,
	
	'EntityProjectileOwned': StructureEntityProjectileOwned,
	'EntityProjectileFireballs': StructureEntityProjectileFireballs,
	
	'EntityProjectileArrow': StructureEntityProjectileArrow,
	'EntityProjectileFireball': StructureEntityProjectileFireball,
	'EntityProjectileThrownPotion': StructureEntityProjectileThrownPotion,
	
	'EntityMinecart': StructureEntityMinecart,
	'EntityMinecartInventory': StructureEntityMinecartInventory,
	'EntityMinecartCommandBlock': StructureEntityMinecartCommandBlock,
	'EntityMinecartFurnace': StructureEntityMinecartFurnace,
	'EntityMinecartHopper': StructureEntityMinecartHopper,
	'EntityMinecartTNT': StructureEntityMinecartTNT,
	'EntityMinecartSpawner': StructureEntityMinecartSpawner,
	
	'EntityItem': StructureEntityItem,
	'EntityFallingSand': StructureEntityFallingSand,
	'EntityFirework': StructureEntityFirework,
	'EntityItemFrame': StructureEntityItemFrame,
	'EntityPaintingLike': StructureEntityPaintingLike,
	'EntityPainting': StructureEntityPainting,
	'EntityPrimedTNT': StructureEntityPrimedTNT,
	
}

//**INFO FROM MC STARTS HERE**//
/**BLOCKS**/
blocks = [
{id:1,stringId:"minecraft:stone",data:"0",name:"Stone"},
{id:2,stringId:"minecraft:grass",data:"0",name:"Grass Block"},
{id:3,stringId:"minecraft:dirt",data:"0",name:"Dirt"},
{id:3,stringId:"minecraft:dirt",data:1,name:"Grassless Dirt"},
{id:3,stringId:"minecraft:dirt",data:2,name:"Podzol"},
{id:4,stringId:"minecraft:cobblestone",data:"0",name:"Cobblestone"},
{id:5,stringId:"minecraft:planks",data:"0",name:"Oak Wood Planks"},
{id:5,stringId:"minecraft:planks",data:"1",name:"Spruce Wood Planks"},
{id:5,stringId:"minecraft:planks",data:"2",name:"Birch Wood Planks"},
{id:5,stringId:"minecraft:planks",data:"3",name:"Jungle Wood Planks"},
{id:6,stringId:"minecraft:sapling",data:"0",name:"Oak Sapling"},
{id:6,stringId:"minecraft:sapling",data:"1",name:"Spruce Sapling"},
{id:6,stringId:"minecraft:sapling",data:"2",name:"Birch Sapling"},
{id:6,stringId:"minecraft:sapling",data:"3",name:"Jungle Sapling"},
{id:7,stringId:"minecraft:bedrock",data:"0",name:"Bedrock"},
{id:8,stringId:"minecraft:flowing_water",data:"0",name:"Flowing Water"},
{id:9,stringId:"minecraft:water",data:"0",name:"Still Water"},
{id:10,stringId:"minecraft:flowing_lava",data:"0",name:"Flowing Lava"},
{id:11,stringId:"minecraft:lava",data:"0",name:"Still Lava"},
{id:12,stringId:"minecraft:sand",data:"0",name:"Sand"},
{id:13,stringId:"minecraft:gravel",data:"0",name:"Gravel"},
{id:14,stringId:"minecraft:gold_ore",data:"0",name:"Gold Ore"},
{id:15,stringId:"minecraft:iron_ore",data:"0",name:"Iron Ore"},
{id:16,stringId:"minecraft:coal_ore",data:"0",name:"Coal Ore"},
{id:17,stringId:"minecraft:log",data:"0",name:"Oak Wood"},
{id:17,stringId:"minecraft:log",data:"1",name:"Spruce Wood"},
{id:17,stringId:"minecraft:log",data:"2",name:"Birch Wood"},
{id:17,stringId:"minecraft:log",data:"3",name:"Jungle Wood"},
{id:18,stringId:"minecraft:leaves",data:"0",name:"Oak Leaves"},
{id:18,stringId:"minecraft:leaves",data:"1",name:"Spruce Leaves"},
{id:18,stringId:"minecraft:leaves",data:"2",name:"Birch Leaves"},
{id:18,stringId:"minecraft:leaves",data:"3",name:"Jungle Leaves"},
{id:19,stringId:"minecraft:sponge",data:"0",name:"Sponge"},
{id:20,stringId:"minecraft:glass",data:"0",name:"Glass"},
{id:21,stringId:"minecraft:lapis_ore",data:"0",name:"Lapis Lazuli Ore"},
{id:22,stringId:"minecraft:lapis_block",data:"0",name:"Lapis Lazuli Block"},
{id:23,stringId:"minecraft:dispenser",data:"0",name:"Dispenser",structure:"BlockTrap"},
{id:24,stringId:"minecraft:sandstone",data:"0",name:"Sandstone"},
{id:24,stringId:"minecraft:sandstone",data:"1",name:"Chiseled Sandstone"},
{id:24,stringId:"minecraft:sandstone",data:"2",name:"Smooth Sandstone"},
{id:25,stringId:"minecraft:noteblock",data:"0",name:"Note Block",structure:"BlockMusic"},
{id:26,stringId:"minecraft:bed",data:"0",name:"Bed"},
{id:27,stringId:"minecraft:golden_rail",data:"0",name:"Powered Rail"},
{id:28,stringId:"minecraft:detector_rail",data:"0",name:"Detector Rail"},
{id:29,stringId:"minecraft:sticky_piston",data:"0",name:"Sticky Piston",structure:"BlockPiston"},
{id:30,stringId:"minecraft:web",data:"0",name:"Cobweb"},
{id:31,stringId:"minecraft:tallgrass",data:"1",name:"Tall Grass"},
{id:31,stringId:"minecraft:tallgrass",data:"2",name:"Fern"},
{id:32,stringId:"minecraft:deadbush",data:"0",name:"Dead Bush"},
{id:33,stringId:"minecraft:piston",data:"0",name:"Piston",structure:"BlockPiston"},
{id:35,stringId:"minecraft:wool",data:"0",name:"White Wool"},
{id:35,stringId:"minecraft:wool",data:"1",name:"Orange Wool"},
{id:35,stringId:"minecraft:wool",data:"2",name:"Magenta Wool"},
{id:35,stringId:"minecraft:wool",data:"3",name:"Light Blue Wool"},
{id:35,stringId:"minecraft:wool",data:"4",name:"Yellow Wool"},
{id:35,stringId:"minecraft:wool",data:"5",name:"Lime Wool"},
{id:35,stringId:"minecraft:wool",data:"6",name:"Pink Wool"},
{id:35,stringId:"minecraft:wool",data:"7",name:"Gray Wool"},
{id:35,stringId:"minecraft:wool",data:"8",name:"Light Gray Wool"},
{id:35,stringId:"minecraft:wool",data:"9",name:"Cyan Wool"},
{id:35,stringId:"minecraft:wool",data:"10",name:"Purple Wool"},
{id:35,stringId:"minecraft:wool",data:"11",name:"Blue Wool"},
{id:35,stringId:"minecraft:wool",data:"12",name:"Brown Wool"},
{id:35,stringId:"minecraft:wool",data:"13",name:"Green Wool"},
{id:35,stringId:"minecraft:wool",data:"14",name:"Red Wool"},
{id:35,stringId:"minecraft:wool",data:"15",name:"Black Wool"},
{id:37,stringId:"minecraft:yellow_flower",data:"0",name:"Flower"},
{id:38,stringId:"minecraft:red_flower",data:"0",name:"Rose"},
{id:39,stringId:"minecraft:brown_mushroom",data:"0",name:"Brown Mushroom"},
{id:40,stringId:"minecraft:red_mushroom",data:"0",name:"Red Mushroom"},
{id:41,stringId:"minecraft:gold_block",data:"0",name:"Block of Gold"},
{id:42,stringId:"minecraft:iron_block",data:"0",name:"Block of Iron"},
{id:44,stringId:"minecraft:stone_slab",data:"0",name:"Stone Slab"},
{id:44,stringId:"minecraft:stone_slab",data:"1",name:"Sandstone Slab"},
{id:44,stringId:"minecraft:stone_slab",data:"3",name:"Cobblestone Slab"},
{id:44,stringId:"minecraft:stone_slab",data:"4",name:"Bricks Slab"},
{id:44,stringId:"minecraft:stone_slab",data:"5",name:"Stone Bricks Slab"},
{id:44,stringId:"minecraft:stone_slab",data:"6",name:"Nether Brick Slab"},
{id:44,stringId:"minecraft:stone_slab",data:"7",name:"Quartz Slab"},
{id:45,stringId:"minecraft:brick_block",data:"0",name:"Bricks"},
{id:46,stringId:"minecraft:tnt",data:"0",name:"TNT"},
{id:47,stringId:"minecraft:bookshelf",data:"0",name:"Bookshelf"},
{id:48,stringId:"minecraft:mossy_cobblestone",data:"0",name:"Moss Stone"},
{id:49,stringId:"minecraft:obsidian",data:"0",name:"Obsidian"},
{id:50,stringId:"minecraft:torch",data:"0",name:"Torch"},
{id:51,stringId:"minecraft:fire",data:"0",name:"Fire"},
{id:52,stringId:"minecraft:mob_spawner",data:"0",name:"Monster Spawner",structure:"BlockMobSpawner"},
{id:53,stringId:"minecraft:oak_stairs",data:"0",name:"Oak Wood Stairs"},
{id:54,stringId:"minecraft:chest",data:"0",name:"Chest",structure:"BlockChest"},
{id:55,stringId:"minecraft:redstone_wire",data:"0",name:"Redstone Dust"},
{id:56,stringId:"minecraft:diamond_ore",data:"0",name:"Diamond Ore"},
{id:57,stringId:"minecraft:diamond_block",data:"0",name:"Block of Diamond"},
{id:58,stringId:"minecraft:crafting_table",data:"0",name:"Crafting Table"},
{id:59,stringId:"minecraft:wheat",data:"0",name:"Crops"},
{id:60,stringId:"minecraft:farmland",data:"0",name:"Farmland"},
{id:61,stringId:"minecraft:furnace",data:"0",name:"Furnace",structure:"BlockFurnace"},
{id:62,stringId:"minecraft:lit_furnace",data:"0",name:"Furnace (Lit)",structure:"BlockFurnace"},
{id:63,stringId:"minecraft:standing_sign",data:"0",name:"Sign",structure:"BlockSign"},
{id:64,stringId:"minecraft:wooden_door",data:"0",name:"Wooden Door"},
{id:65,stringId:"minecraft:ladder",data:"0",name:"Ladder"},
{id:66,stringId:"minecraft:rail",data:"0",name:"Rail"},
{id:67,stringId:"minecraft:stone_stairs",data:"0",name:"Stone Stairs"},
{id:68,stringId:"minecraft:wall_sign",data:"0",name:"Sign",structure:"BlockSign"},
{id:69,stringId:"minecraft:lever",data:"0",name:"Lever"},
{id:70,stringId:"minecraft:stone_pressure_plate",data:"0",name:"Pressure Plate"},
{id:71,stringId:"minecraft:iron_door",data:"0",name:"Iron Door"},
{id:72,stringId:"minecraft:wooden_pressure_plate",data:"0",name:"Pressure Plate"},
{id:73,stringId:"minecraft:redstone_ore",data:"0",name:"Redstone Ore"},
{id:74,stringId:"minecraft:lit_redstone_ore",data:"0",name:"Redstone Ore"},
{id:75,stringId:"minecraft:unlit_redstone_torch",data:"0",name:"Redstone Torch"},
{id:76,stringId:"minecraft:redstone_torch",data:"0",name:"Redstone Torch"},
{id:77,stringId:"minecraft:stone_button",data:"0",name:"Button"},
{id:78,stringId:"minecraft:snow_layer",data:"0",name:"Snow"},
{id:79,stringId:"minecraft:ice",data:"0",name:"Ice"},
{id:80,stringId:"minecraft:snow",data:"0",name:"Snow"},
{id:81,stringId:"minecraft:cactus",data:"0",name:"Cactus"},
{id:82,stringId:"minecraft:clay",data:"0",name:"Clay"},
{id:83,stringId:"minecraft:reeds",data:"0",name:"Sugar cane"},
{id:84,stringId:"minecraft:jukebox",data:"0",name:"Jukebox",structure:"BlockRecordPlayer"},
{id:85,stringId:"minecraft:fence",data:"0",name:"Fence"},
{id:86,stringId:"minecraft:pumpkin",data:"0",name:"Pumpkin"},
{id:87,stringId:"minecraft:netherrack",data:"0",name:"Netherrack"},
{id:88,stringId:"minecraft:soul_sand",data:"0",name:"Soul Sand"},
{id:89,stringId:"minecraft:glowstone",data:"0",name:"Glowstone"},
{id:90,stringId:"minecraft:portal",data:"0",name:"Portal"},
{id:91,stringId:"minecraft:lit_pumpkin",data:"0",name:"Jack o'Lantern"},
{id:92,stringId:"minecraft:cake",data:"0",name:"Cake"},
{id:93,stringId:"minecraft:unpowered_repeater",data:"0",name:"Redstone Repeater"},
{id:94,stringId:"minecraft:powered_repeater",data:"0",name:"Redstone Repeater"},
{id:95,stringId:"minecraft:chest_locked_aprilfools_super_old_legacy_we_should_not_even_have_this",data:"0",name:"Locked chest"},
{id:96,stringId:"minecraft:trapdoor",data:"0",name:"Trapdoor"},
{id:97,stringId:"minecraft:monster_egg",data:"0",name:"Stone Monster Egg"},
{id:97,stringId:"minecraft:monster_egg",data:"1",name:"Cobblestone Monster Egg"},
{id:97,stringId:"minecraft:monster_egg",data:"2",name:"Stone Brick Monster Egg"},
{id:98,stringId:"minecraft:stonebrick",data:"0",name:"Stone Bricks"},
{id:98,stringId:"minecraft:stonebrick",data:"1",name:"Mossy Stone Bricks"},
{id:98,stringId:"minecraft:stonebrick",data:"2",name:"Cracked Stone Bricks"},
{id:98,stringId:"minecraft:stonebrick",data:"3",name:"Chiseled Stone Bricks"},
{id:99,stringId:"minecraft:brown_mushroom_block",data:"0",name:"Mushroom"},
{id:100,stringId:"minecraft:red_mushroom_block",data:"0",name:"Mushroom"},
{id:101,stringId:"minecraft:iron_bars",data:"0",name:"Iron Bars"},
{id:102,stringId:"minecraft:glass_pane",data:"0",name:"Glass Pane"},
{id:103,stringId:"minecraft:melon_block",data:"0",name:"Melon"},
{id:104,stringId:"minecraft:pumpkin_stem",data:"0",name:"tile.pumpkinStem.name"},
{id:105,stringId:"minecraft:melon_stem",data:"0",name:"tile.pumpkinStem.name"},
{id:106,stringId:"minecraft:vine",data:"0",name:"Vines"},
{id:107,stringId:"minecraft:fence_gate",data:"0",name:"Fence Gate"},
{id:108,stringId:"minecraft:brick_stairs",data:"0",name:"Brick Stairs"},
{id:109,stringId:"minecraft:stone_brick_stairs",data:"0",name:"Stone Brick Stairs"},
{id:110,stringId:"minecraft:mycelium",data:"0",name:"Mycelium"},
{id:111,stringId:"minecraft:waterlily",data:"0",name:"Lily Pad"},
{id:112,stringId:"minecraft:nether_brick",data:"0",name:"Nether Brick"},
{id:113,stringId:"minecraft:nether_brick_fence",data:"0",name:"Nether Brick Fence"},
{id:114,stringId:"minecraft:nether_brick_stairs",data:"0",name:"Nether Brick Stairs"},
{id:115,stringId:"minecraft:nether_wart",data:"0",name:"Nether Wart"},
{id:116,stringId:"minecraft:enchanting_table",data:"0",name:"Enchantment Table"},
{id:117,stringId:"minecraft:brewing_stand",data:"0",name:"Brewing Stand",structure:"BlockCauldron"},
{id:118,stringId:"minecraft:cauldron",data:"0",name:"Cauldron"},
{id:119,stringId:"minecraft:end_portal",data:"0",name:"tile.null.name"},
{id:120,stringId:"minecraft:end_portal_frame",data:"0",name:"End Portal"},
{id:121,stringId:"minecraft:end_stone",data:"0",name:"End Stone"},
{id:122,stringId:"minecraft:dragon_egg",data:"0",name:"Dragon Egg"},
{id:123,stringId:"minecraft:redstone_lamp",data:"0",name:"Redstone Lamp"},
{id:124,stringId:"minecraft:lit_redstone_lamp",data:"0",name:"Redstone Lamp"},
{id:126,stringId:"minecraft:wooden_slab",data:"0",name:"Oak Wood Slab"},
{id:126,stringId:"minecraft:wooden_slab",data:"1",name:"Spruce Wood Slab"},
{id:126,stringId:"minecraft:wooden_slab",data:"2",name:"Birch Wood Slab"},
{id:126,stringId:"minecraft:wooden_slab",data:"3",name:"Jungle Wood Slab"},
{id:127,stringId:"minecraft:cocoa",data:"0",name:"Cocoa"},
{id:128,stringId:"minecraft:sandstone_stairs",data:"0",name:"Sandstone Stairs"},
{id:129,stringId:"minecraft:emerald_ore",data:"0",name:"Emerald Ore"},
{id:130,stringId:"minecraft:ender_chest",data:"0",name:"Ender Chest"},
{id:131,stringId:"minecraft:tripwire_hook",data:"0",name:"Tripwire Hook"},
{id:132,stringId:"minecraft:tripwire",data:"0",name:"Tripwire"},
{id:133,stringId:"minecraft:emerald_block",data:"0",name:"Block of Emerald"},
{id:134,stringId:"minecraft:spruce_stairs",data:"0",name:"Spruce Wood Stairs"},
{id:135,stringId:"minecraft:birch_stairs",data:"0",name:"Birch Wood Stairs"},
{id:136,stringId:"minecraft:jungle_stairs",data:"0",name:"Jungle Wood Stairs"},
{id:137,stringId:"minecraft:command_block",data:"0",name:"Command Block",structure:"BlockControl"},
{id:138,stringId:"minecraft:beacon",data:"0",name:"Beacon",structure:"BlockBeacon"},
{id:139,stringId:"minecraft:cobblestone_wall",data:"0",name:"Cobblestone Wall"},
{id:139,stringId:"minecraft:cobblestone_wall",data:"1",name:"Mossy Cobblestone Wall"},
{id:140,stringId:"minecraft:flower_pot",data:"0",name:"Flower Pot"},
{id:141,stringId:"minecraft:carrots",data:"0",name:"Carrots"},
{id:142,stringId:"minecraft:potatoes",data:"0",name:"Potatoes"},
{id:143,stringId:"minecraft:wooden_button",data:"0",name:"Button"},
{id:144,stringId:"minecraft:skull",data:"0",name:"tile.skull.name",structure:"BlockSkull"},
{id:145,stringId:"minecraft:anvil",data:"0",name:"Anvil"},
{id:145,stringId:"minecraft:anvil",data:"1",name:"Slightly Damaged Anvil"},
{id:145,stringId:"minecraft:anvil",data:"2",name:"Very Damaged Anvil"},
{id:146,stringId:"minecraft:trapped_chest",data:"0",name:"Trapped Chest",structure:"BlockChest"},
{id:147,stringId:"minecraft:light_weighted_pressure_plate",data:"0",name:"Weighted Pressure Plate (Light)"},
{id:148,stringId:"minecraft:heavy_weighted_pressure_plate",data:"0",name:"Weighted Pressure Plate (Heavy)"},
{id:149,stringId:"minecraft:unpowered_comparator",data:"*",name:"Redstone Comparator",structure:"BlockComparator"},
{id:150,stringId:"minecraft:powered_comparator",data:"*",name:"Redstone Comparator",structure:"BlockComparator"},
{id:151,stringId:"minecraft:daylight_detector",data:"0",name:"Daylight Sensor"},
{id:152,stringId:"minecraft:redstone_block",data:"0",name:"Block of Redstone"},
{id:153,stringId:"minecraft:quartz_ore",data:"0",name:"Nether Quartz Ore"},
{id:154,stringId:"minecraft:hopper",data:"0",name:"Hopper",structure:"BlockHopper"},
{id:155,stringId:"minecraft:quartz_block",data:"0",name:"Block of Quartz"},
{id:155,stringId:"minecraft:quartz_block",data:"1",name:"Chiseled Quartz Block"},
{id:155,stringId:"minecraft:quartz_block",data:"2",name:"Pillar Quartz Block"},
{id:156,stringId:"minecraft:quartz_stairs",data:"0",name:"Quartz Stairs"},
{id:157,stringId:"minecraft:activator_rail",data:"0",name:"Activator Rail"},
{id:158,stringId:"minecraft:dropper",data:"0",name:"Dropper",structure:"BlockTrap"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:"0",name:"White Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:"1",name:"Orange Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:"2",name:"Magenta Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:"3",name:"Light Blue Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:"4",name:"Yellow Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:"5",name:"Lime Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:"6",name:"Pink Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:"7",name:"Gray Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:"8",name:"Light Gray Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:"9",name:"Cyan Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:"10",name:"Purple Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:"11",name:"Blue Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:"12",name:"Brown Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:"13",name:"Green Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:"14",name:"Red Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:"15",name:"Black Stained Clay"},
{id:170,stringId:"minecraft:hay_block",data:"0",name:"Hay Bale"},
{id:171,stringId:"minecraft:carpet",data:"0",name:"Carpet"},
{id:171,stringId:"minecraft:carpet",data:"1",name:"Orange Carpet"},
{id:171,stringId:"minecraft:carpet",data:"2",name:"Magenta Carpet"},
{id:171,stringId:"minecraft:carpet",data:"3",name:"Light Blue Carpet"},
{id:171,stringId:"minecraft:carpet",data:"4",name:"Yellow Carpet"},
{id:171,stringId:"minecraft:carpet",data:"5",name:"Lime Carpet"},
{id:171,stringId:"minecraft:carpet",data:"6",name:"Pink Carpet"},
{id:171,stringId:"minecraft:carpet",data:"7",name:"Gray Carpet"},
{id:171,stringId:"minecraft:carpet",data:"8",name:"Light Gray Carpet"},
{id:171,stringId:"minecraft:carpet",data:"9",name:"Cyan Carpet"},
{id:171,stringId:"minecraft:carpet",data:"10",name:"Purple Carpet"},
{id:171,stringId:"minecraft:carpet",data:"11",name:"Blue Carpet"},
{id:171,stringId:"minecraft:carpet",data:"12",name:"Brown Carpet"},
{id:171,stringId:"minecraft:carpet",data:"13",name:"Green Carpet"},
{id:171,stringId:"minecraft:carpet",data:"14",name:"Red Carpet"},
{id:171,stringId:"minecraft:carpet",data:"15",name:"Black Carpet"},
{id:172,stringId:"minecraft:hardened_clay",data:"0",name:"Hardened Clay"},
{id:173,stringId:"minecraft:coal_block",data:"0",name:"Block of Coal"},
{id:174,stringId:"minecraft:packed_ice",data:0,name:"Packed Ice"},
{id:175,stringId:"minecraft:double_plant",data:0,name:"Sunflower"},
{id:175,stringId:"minecraft:double_plant",data:1,name:"Lilac"},
{id:175,stringId:"minecraft:double_plant",data:2,name:"Double Tall Grass"},
{id:175,stringId:"minecraft:double_plant",data:3,name:"Large Fern"},
{id:175,stringId:"minecraft:double_plant",data:4,name:"RoseBush"},
{id:175,stringId:"minecraft:double_plant",data:5,name:"Peony"}
];
/**ITEMS**/
items = [
{id:1,stringId:"minecraft:stone",data:0,name:"Stone"},
{id:2,stringId:"minecraft:grass",data:0,name:"Grass Block"},
{id:3,stringId:"minecraft:dirt",data:0,name:"Dirt"},
{id:3,stringId:"minecraft:dirt",data:1,name:"Grassless Dirt"},
{id:3,stringId:"minecraft:dirt",data:2,name:"Podzol"},
{id:4,stringId:"minecraft:cobblestone",data:0,name:"Cobblestone"},
{id:5,stringId:"minecraft:planks",data:0,name:"Oak Wood Planks"},
{id:5,stringId:"minecraft:planks",data:1,name:"Spruce Wood Planks"},
{id:5,stringId:"minecraft:planks",data:2,name:"Birch Wood Planks"},
{id:5,stringId:"minecraft:planks",data:3,name:"Jungle Wood Planks"},
{id:6,stringId:"minecraft:sapling",data:0,name:"Oak Sapling"},
{id:6,stringId:"minecraft:sapling",data:1,name:"Spruce Sapling"},
{id:6,stringId:"minecraft:sapling",data:2,name:"Birch Sapling"},
{id:6,stringId:"minecraft:sapling",data:3,name:"Jungle Sapling"},
{id:7,stringId:"minecraft:bedrock",data:0,name:"Bedrock"},
{id:8,stringId:"minecraft:flowing_water",data:0,name:"Flowing Water"},
{id:9,stringId:"minecraft:water",data:0,name:"Still Water"},
{id:10,stringId:"minecraft:flowing_lava",data:0,name:"Flowing Lava"},
{id:11,stringId:"minecraft:lava",data:0,name:"Still Lava"},
{id:12,stringId:"minecraft:sand",data:0,name:"Sand"},
{id:13,stringId:"minecraft:gravel",data:0,name:"Gravel"},
{id:14,stringId:"minecraft:gold_ore",data:0,name:"Gold Ore"},
{id:15,stringId:"minecraft:iron_ore",data:0,name:"Iron Ore"},
{id:16,stringId:"minecraft:coal_ore",data:0,name:"Coal Ore"},
{id:17,stringId:"minecraft:log",data:0,name:"Oak Wood"},
{id:17,stringId:"minecraft:log",data:1,name:"Spruce Wood"},
{id:17,stringId:"minecraft:log",data:2,name:"Birch Wood"},
{id:17,stringId:"minecraft:log",data:3,name:"Jungle Wood"},
{id:18,stringId:"minecraft:leaves",data:0,name:"Oak Leaves"},
{id:18,stringId:"minecraft:leaves",data:1,name:"Spruce Leaves"},
{id:18,stringId:"minecraft:leaves",data:2,name:"Birch Leaves"},
{id:18,stringId:"minecraft:leaves",data:3,name:"Jungle Leaves"},
{id:19,stringId:"minecraft:sponge",data:0,name:"Sponge"},
{id:20,stringId:"minecraft:glass",data:0,name:"Glass"},
{id:21,stringId:"minecraft:lapis_ore",data:0,name:"Lapis Lazuli Ore"},
{id:22,stringId:"minecraft:lapis_block",data:0,name:"Lapis Lazuli Block"},
{id:23,stringId:"minecraft:dispenser",data:0,name:"Dispenser"},
{id:24,stringId:"minecraft:sandstone",data:0,name:"Sandstone"},
{id:24,stringId:"minecraft:sandstone",data:1,name:"Chiseled Sandstone"},
{id:24,stringId:"minecraft:sandstone",data:2,name:"Smooth Sandstone"},
{id:25,stringId:"minecraft:noteblock",data:0,name:"Note Block"},
{id:26,stringId:"minecraft:bed",data:0,name:"Bed"},
{id:27,stringId:"minecraft:golden_rail",data:0,name:"Powered Rail"},
{id:28,stringId:"minecraft:detector_rail",data:0,name:"Detector Rail"},
{id:29,stringId:"minecraft:sticky_piston",data:0,name:"Sticky Piston"},
{id:30,stringId:"minecraft:web",data:0,name:"Cobweb"},
{id:31,stringId:"minecraft:tallgrass",data:1,name:"Tall Grass"},
{id:31,stringId:"minecraft:tallgrass",data:2,name:"Fern"},
{id:32,stringId:"minecraft:deadbush",data:0,name:"Dead Bush"},
{id:33,stringId:"minecraft:piston",data:0,name:"Piston"},
{id:35,stringId:"minecraft:wool",data:0,name:"White Wool"},
{id:35,stringId:"minecraft:wool",data:1,name:"Orange Wool"},
{id:35,stringId:"minecraft:wool",data:2,name:"Magenta Wool"},
{id:35,stringId:"minecraft:wool",data:3,name:"Light Blue Wool"},
{id:35,stringId:"minecraft:wool",data:4,name:"Yellow Wool"},
{id:35,stringId:"minecraft:wool",data:5,name:"Lime Wool"},
{id:35,stringId:"minecraft:wool",data:6,name:"Pink Wool"},
{id:35,stringId:"minecraft:wool",data:7,name:"Gray Wool"},
{id:35,stringId:"minecraft:wool",data:8,name:"Light Gray Wool"},
{id:35,stringId:"minecraft:wool",data:9,name:"Cyan Wool"},
{id:35,stringId:"minecraft:wool",data:10,name:"Purple Wool"},
{id:35,stringId:"minecraft:wool",data:11,name:"Blue Wool"},
{id:35,stringId:"minecraft:wool",data:12,name:"Brown Wool"},
{id:35,stringId:"minecraft:wool",data:13,name:"Green Wool"},
{id:35,stringId:"minecraft:wool",data:14,name:"Red Wool"},
{id:35,stringId:"minecraft:wool",data:15,name:"Black Wool"},
{id:37,stringId:"minecraft:yellow_flower",data:0,name:"Flower"},
{id:38,stringId:"minecraft:red_flower",data:0,name:"Rose"},
{id:39,stringId:"minecraft:brown_mushroom",data:0,name:"Brown Mushroom"},
{id:40,stringId:"minecraft:red_mushroom",data:0,name:"Red Mushroom"},
{id:41,stringId:"minecraft:gold_block",data:0,name:"Block of Gold"},
{id:42,stringId:"minecraft:iron_block",data:0,name:"Block of Iron"},
{id:44,stringId:"minecraft:stone_slab",data:0,name:"Stone Slab"},
{id:44,stringId:"minecraft:stone_slab",data:1,name:"Sandstone Slab"},
{id:44,stringId:"minecraft:stone_slab",data:3,name:"Cobblestone Slab"},
{id:44,stringId:"minecraft:stone_slab",data:4,name:"Bricks Slab"},
{id:44,stringId:"minecraft:stone_slab",data:5,name:"Stone Bricks Slab"},
{id:44,stringId:"minecraft:stone_slab",data:6,name:"Nether Brick Slab"},
{id:44,stringId:"minecraft:stone_slab",data:7,name:"Quartz Slab"},
{id:45,stringId:"minecraft:brick_block",data:0,name:"Bricks"},
{id:46,stringId:"minecraft:tnt",data:0,name:"TNT"},
{id:47,stringId:"minecraft:bookshelf",data:0,name:"Bookshelf"},
{id:48,stringId:"minecraft:mossy_cobblestone",data:0,name:"Moss Stone"},
{id:49,stringId:"minecraft:obsidian",data:0,name:"Obsidian"},
{id:50,stringId:"minecraft:torch",data:0,name:"Torch"},
{id:51,stringId:"minecraft:fire",data:0,name:"Fire"},
{id:52,stringId:"minecraft:mob_spawner",data:0,name:"Monster Spawner"},
{id:53,stringId:"minecraft:oak_stairs",data:0,name:"Oak Wood Stairs"},
{id:54,stringId:"minecraft:chest",data:0,name:"Chest"},
{id:55,stringId:"minecraft:redstone_wire",data:0,name:"Redstone Dust"},
{id:56,stringId:"minecraft:diamond_ore",data:0,name:"Diamond Ore"},
{id:57,stringId:"minecraft:diamond_block",data:0,name:"Block of Diamond"},
{id:58,stringId:"minecraft:crafting_table",data:0,name:"Crafting Table"},
{id:59,stringId:"minecraft:wheat",data:0,name:"Crops"},
{id:60,stringId:"minecraft:farmland",data:0,name:"Farmland"},
{id:61,stringId:"minecraft:furnace",data:0,name:"Furnace"},
{id:62,stringId:"minecraft:lit_furnace",data:0,name:"Furnace (Lit)"},
{id:63,stringId:"minecraft:standing_sign",data:0,name:"Sign"},
{id:64,stringId:"minecraft:wooden_door",data:0,name:"Wooden Door"},
{id:65,stringId:"minecraft:ladder",data:0,name:"Ladder"},
{id:66,stringId:"minecraft:rail",data:0,name:"Rail"},
{id:67,stringId:"minecraft:stone_stairs",data:0,name:"Stone Stairs"},
{id:68,stringId:"minecraft:wall_sign",data:0,name:"Sign"},
{id:69,stringId:"minecraft:lever",data:0,name:"Lever"},
{id:70,stringId:"minecraft:stone_pressure_plate",data:0,name:"Pressure Plate"},
{id:71,stringId:"minecraft:iron_door",data:0,name:"Iron Door"},
{id:72,stringId:"minecraft:wooden_pressure_plate",data:0,name:"Pressure Plate"},
{id:73,stringId:"minecraft:redstone_ore",data:0,name:"Redstone Ore"},
{id:74,stringId:"minecraft:lit_redstone_ore",data:0,name:"Redstone Ore"},
{id:75,stringId:"minecraft:unlit_redstone_torch",data:0,name:"Redstone Torch"},
{id:76,stringId:"minecraft:redstone_torch",data:0,name:"Redstone Torch"},
{id:77,stringId:"minecraft:stone_button",data:0,name:"Button"},
{id:78,stringId:"minecraft:snow_layer",data:0,name:"Snow"},
{id:79,stringId:"minecraft:ice",data:0,name:"Ice"},
{id:80,stringId:"minecraft:snow",data:0,name:"Snow"},
{id:81,stringId:"minecraft:cactus",data:0,name:"Cactus"},
{id:82,stringId:"minecraft:clay",data:0,name:"Clay"},
{id:83,stringId:"minecraft:reeds",data:0,name:"Sugar cane"},
{id:84,stringId:"minecraft:jukebox",data:0,name:"Jukebox"},
{id:85,stringId:"minecraft:fence",data:0,name:"Fence"},
{id:86,stringId:"minecraft:pumpkin",data:0,name:"Pumpkin"},
{id:87,stringId:"minecraft:netherrack",data:0,name:"Netherrack"},
{id:88,stringId:"minecraft:soul_sand",data:0,name:"Soul Sand"},
{id:89,stringId:"minecraft:glowstone",data:0,name:"Glowstone"},
{id:90,stringId:"minecraft:portal",data:0,name:"Portal"},
{id:91,stringId:"minecraft:lit_pumpkin",data:0,name:"Jack o'Lantern"},
{id:92,stringId:"minecraft:cake",data:0,name:"Cake"},
{id:93,stringId:"minecraft:unpowered_repeater",data:0,name:"tile.diode.name"},
{id:94,stringId:"minecraft:powered_repeater",data:0,name:"tile.diode.name"},
{id:95,stringId:"minecraft:chest_locked_aprilfools_super_old_legacy_we_should_not_even_have_this",data:0,name:"Locked chest"},
{id:96,stringId:"minecraft:trapdoor",data:0,name:"Trapdoor"},
{id:97,stringId:"minecraft:monster_egg",data:0,name:"Stone Monster Egg"},
{id:97,stringId:"minecraft:monster_egg",data:1,name:"Cobblestone Monster Egg"},
{id:97,stringId:"minecraft:monster_egg",data:2,name:"Stone Brick Monster Egg"},
{id:98,stringId:"minecraft:stonebrick",data:0,name:"Stone Bricks"},
{id:98,stringId:"minecraft:stonebrick",data:1,name:"Mossy Stone Bricks"},
{id:98,stringId:"minecraft:stonebrick",data:2,name:"Cracked Stone Bricks"},
{id:98,stringId:"minecraft:stonebrick",data:3,name:"Chiseled Stone Bricks"},
{id:99,stringId:"minecraft:brown_mushroom_block",data:0,name:"Mushroom"},
{id:100,stringId:"minecraft:red_mushroom_block",data:0,name:"Mushroom"},
{id:101,stringId:"minecraft:iron_bars",data:0,name:"Iron Bars"},
{id:102,stringId:"minecraft:glass_pane",data:0,name:"Glass Pane"},
{id:103,stringId:"minecraft:melon_block",data:0,name:"Melon"},
{id:104,stringId:"minecraft:pumpkin_stem",data:0,name:"tile.pumpkinStem.name"},
{id:105,stringId:"minecraft:melon_stem",data:0,name:"tile.pumpkinStem.name"},
{id:106,stringId:"minecraft:vine",data:0,name:"Vines"},
{id:107,stringId:"minecraft:fence_gate",data:0,name:"Fence Gate"},
{id:108,stringId:"minecraft:brick_stairs",data:0,name:"Brick Stairs"},
{id:109,stringId:"minecraft:stone_brick_stairs",data:0,name:"Stone Brick Stairs"},
{id:110,stringId:"minecraft:mycelium",data:0,name:"Mycelium"},
{id:111,stringId:"minecraft:waterlily",data:0,name:"Lily Pad"},
{id:112,stringId:"minecraft:nether_brick",data:0,name:"Nether Brick"},
{id:113,stringId:"minecraft:nether_brick_fence",data:0,name:"Nether Brick Fence"},
{id:114,stringId:"minecraft:nether_brick_stairs",data:0,name:"Nether Brick Stairs"},
{id:115,stringId:"minecraft:nether_wart",data:0,name:"Nether Wart"},
{id:116,stringId:"minecraft:enchanting_table",data:0,name:"Enchantment Table"},
{id:117,stringId:"minecraft:brewing_stand",data:0,name:"tile.brewingStand.name"},
{id:118,stringId:"minecraft:cauldron",data:0,name:"Cauldron"},
{id:119,stringId:"minecraft:end_portal",data:0,name:"tile.null.name"},
{id:120,stringId:"minecraft:end_portal_frame",data:0,name:"End Portal"},
{id:121,stringId:"minecraft:end_stone",data:0,name:"End Stone"},
{id:122,stringId:"minecraft:dragon_egg",data:0,name:"Dragon Egg"},
{id:123,stringId:"minecraft:redstone_lamp",data:0,name:"Redstone Lamp"},
{id:124,stringId:"minecraft:lit_redstone_lamp",data:0,name:"Redstone Lamp"},
{id:126,stringId:"minecraft:wooden_slab",data:0,name:"Oak Wood Slab"},
{id:126,stringId:"minecraft:wooden_slab",data:1,name:"Spruce Wood Slab"},
{id:126,stringId:"minecraft:wooden_slab",data:2,name:"Birch Wood Slab"},
{id:126,stringId:"minecraft:wooden_slab",data:3,name:"Jungle Wood Slab"},
{id:127,stringId:"minecraft:cocoa",data:0,name:"Cocoa"},
{id:128,stringId:"minecraft:sandstone_stairs",data:0,name:"Sandstone Stairs"},
{id:129,stringId:"minecraft:emerald_ore",data:0,name:"Emerald Ore"},
{id:130,stringId:"minecraft:ender_chest",data:0,name:"Ender Chest"},
{id:131,stringId:"minecraft:tripwire_hook",data:0,name:"Tripwire Hook"},
{id:132,stringId:"minecraft:tripwire",data:0,name:"Tripwire"},
{id:133,stringId:"minecraft:emerald_block",data:0,name:"Block of Emerald"},
{id:134,stringId:"minecraft:spruce_stairs",data:0,name:"Spruce Wood Stairs"},
{id:135,stringId:"minecraft:birch_stairs",data:0,name:"Birch Wood Stairs"},
{id:136,stringId:"minecraft:jungle_stairs",data:0,name:"Jungle Wood Stairs"},
{id:137,stringId:"minecraft:command_block",data:0,name:"Command Block"},
{id:138,stringId:"minecraft:beacon",data:0,name:"Beacon"},
{id:139,stringId:"minecraft:cobblestone_wall",data:0,name:"Cobblestone Wall"},
{id:139,stringId:"minecraft:cobblestone_wall",data:1,name:"Mossy Cobblestone Wall"},
{id:140,stringId:"minecraft:flower_pot",data:0,name:"tile.flowerPot.name"},
{id:141,stringId:"minecraft:carrots",data:0,name:"Carrots"},
{id:142,stringId:"minecraft:potatoes",data:0,name:"Potatoes"},
{id:143,stringId:"minecraft:wooden_button",data:0,name:"Button"},
{id:144,stringId:"minecraft:skull",data:0,name:"tile.skull.name"},
{id:145,stringId:"minecraft:anvil",data:0,name:"Anvil"},
{id:145,stringId:"minecraft:anvil",data:1,name:"Slightly Damaged Anvil"},
{id:145,stringId:"minecraft:anvil",data:2,name:"Very Damaged Anvil"},
{id:146,stringId:"minecraft:trapped_chest",data:0,name:"Trapped Chest"},
{id:147,stringId:"minecraft:light_weighted_pressure_plate",data:0,name:"Weighted Pressure Plate (Light)"},
{id:148,stringId:"minecraft:heavy_weighted_pressure_plate",data:0,name:"Weighted Pressure Plate (Heavy)"},
{id:149,stringId:"minecraft:unpowered_comparator",data:0,name:"tile.comparator.name"},
{id:150,stringId:"minecraft:powered_comparator",data:0,name:"tile.comparator.name"},
{id:151,stringId:"minecraft:daylight_detector",data:0,name:"Daylight Sensor"},
{id:152,stringId:"minecraft:redstone_block",data:0,name:"Block of Redstone"},
{id:153,stringId:"minecraft:quartz_ore",data:0,name:"Nether Quartz Ore"},
{id:154,stringId:"minecraft:hopper",data:0,name:"Hopper"},
{id:155,stringId:"minecraft:quartz_block",data:0,name:"Block of Quartz"},
{id:155,stringId:"minecraft:quartz_block",data:1,name:"Chiseled Quartz Block"},
{id:155,stringId:"minecraft:quartz_block",data:2,name:"Pillar Quartz Block"},
{id:156,stringId:"minecraft:quartz_stairs",data:0,name:"Quartz Stairs"},
{id:157,stringId:"minecraft:activator_rail",data:0,name:"Activator Rail"},
{id:158,stringId:"minecraft:dropper",data:0,name:"Dropper"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:0,name:"White Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:1,name:"Orange Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:2,name:"Magenta Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:3,name:"Light Blue Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:4,name:"Yellow Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:5,name:"Lime Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:6,name:"Pink Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:7,name:"Gray Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:8,name:"Light Gray Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:9,name:"Cyan Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:10,name:"Purple Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:11,name:"Blue Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:12,name:"Brown Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:13,name:"Green Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:14,name:"Red Stained Clay"},
{id:159,stringId:"minecraft:stained_hardened_clay",data:15,name:"Black Stained Clay"},
{id:170,stringId:"minecraft:hay_block",data:0,name:"Hay Bale"},
{id:171,stringId:"minecraft:carpet",data:0,name:"Carpet"},
{id:171,stringId:"minecraft:carpet",data:1,name:"Orange Carpet"},
{id:171,stringId:"minecraft:carpet",data:2,name:"Magenta Carpet"},
{id:171,stringId:"minecraft:carpet",data:3,name:"Light Blue Carpet"},
{id:171,stringId:"minecraft:carpet",data:4,name:"Yellow Carpet"},
{id:171,stringId:"minecraft:carpet",data:5,name:"Lime Carpet"},
{id:171,stringId:"minecraft:carpet",data:6,name:"Pink Carpet"},
{id:171,stringId:"minecraft:carpet",data:7,name:"Gray Carpet"},
{id:171,stringId:"minecraft:carpet",data:8,name:"Light Gray Carpet"},
{id:171,stringId:"minecraft:carpet",data:9,name:"Cyan Carpet"},
{id:171,stringId:"minecraft:carpet",data:10,name:"Purple Carpet"},
{id:171,stringId:"minecraft:carpet",data:11,name:"Blue Carpet"},
{id:171,stringId:"minecraft:carpet",data:12,name:"Brown Carpet"},
{id:171,stringId:"minecraft:carpet",data:13,name:"Green Carpet"},
{id:171,stringId:"minecraft:carpet",data:14,name:"Red Carpet"},
{id:171,stringId:"minecraft:carpet",data:15,name:"Black Carpet"},
{id:172,stringId:"minecraft:hardened_clay",data:0,name:"Hardened Clay"},
{id:173,stringId:"minecraft:coal_block",data:0,name:"Block of Coal"},
{id:256,stringId:"minecraft:iron_shovel",data:0,name:"Iron Shovel"},
{id:257,stringId:"minecraft:iron_pickaxe",data:0,name:"Iron Pickaxe"},
{id:258,stringId:"minecraft:iron_axe",data:0,name:"Iron Axe"},
{id:259,stringId:"minecraft:flint_and_steel",data:0,name:"Flint and Steel"},
{id:260,stringId:"minecraft:apple",data:0,name:"Apple"},
{id:261,stringId:"minecraft:bow",data:0,name:"Bow"},
{id:262,stringId:"minecraft:arrow",data:0,name:"Arrow"},
{id:263,stringId:"minecraft:coal",data:0,name:"Coal"},
{id:263,stringId:"minecraft:coal",data:1,name:"Charcoal"},
{id:264,stringId:"minecraft:diamond",data:0,name:"Diamond"},
{id:265,stringId:"minecraft:iron_ingot",data:0,name:"Iron Ingot"},
{id:266,stringId:"minecraft:gold_ingot",data:0,name:"Gold Ingot"},
{id:267,stringId:"minecraft:iron_sword",data:0,name:"Iron Sword"},
{id:268,stringId:"minecraft:wooden_sword",data:0,name:"Wooden Sword"},
{id:269,stringId:"minecraft:wooden_shovel",data:0,name:"Wooden Shovel"},
{id:270,stringId:"minecraft:wooden_pickaxe",data:0,name:"Wooden Pickaxe"},
{id:271,stringId:"minecraft:wooden_axe",data:0,name:"Wooden Axe"},
{id:272,stringId:"minecraft:stone_sword",data:0,name:"Stone Sword"},
{id:273,stringId:"minecraft:stone_shovel",data:0,name:"Stone Shovel"},
{id:274,stringId:"minecraft:stone_pickaxe",data:0,name:"Stone Pickaxe"},
{id:275,stringId:"minecraft:stone_axe",data:0,name:"Stone Axe"},
{id:276,stringId:"minecraft:diamond_sword",data:0,name:"Diamond Sword"},
{id:277,stringId:"minecraft:diamond_shovel",data:0,name:"Diamond Shovel"},
{id:278,stringId:"minecraft:diamond_pickaxe",data:0,name:"Diamond Pickaxe"},
{id:279,stringId:"minecraft:diamond_axe",data:0,name:"Diamond Axe"},
{id:280,stringId:"minecraft:stick",data:0,name:"Stick"},
{id:281,stringId:"minecraft:bowl",data:0,name:"Bowl"},
{id:282,stringId:"minecraft:mushroom_stew",data:0,name:"Mushroom Stew"},
{id:283,stringId:"minecraft:golden_sword",data:0,name:"Golden Sword"},
{id:284,stringId:"minecraft:golden_shovel",data:0,name:"Golden Shovel"},
{id:285,stringId:"minecraft:golden_pickaxe",data:0,name:"Golden Pickaxe"},
{id:286,stringId:"minecraft:golden_axe",data:0,name:"Golden Axe"},
{id:287,stringId:"minecraft:string",data:0,name:"String"},
{id:288,stringId:"minecraft:feather",data:0,name:"Feather"},
{id:289,stringId:"minecraft:gunpowder",data:0,name:"Gunpowder"},
{id:290,stringId:"minecraft:wooden_hoe",data:0,name:"Wooden Hoe"},
{id:291,stringId:"minecraft:stone_hoe",data:0,name:"Stone Hoe"},
{id:292,stringId:"minecraft:iron_hoe",data:0,name:"Iron Hoe"},
{id:293,stringId:"minecraft:diamond_hoe",data:0,name:"Diamond Hoe"},
{id:294,stringId:"minecraft:golden_hoe",data:0,name:"Golden Hoe"},
{id:295,stringId:"minecraft:wheat_seeds",data:0,name:"Seeds"},
{id:296,stringId:"minecraft:wheat",data:0,name:"Wheat"},
{id:297,stringId:"minecraft:bread",data:0,name:"Bread"},
{id:298,stringId:"minecraft:leather_helmet",data:0,name:"Leather Cap",structure:"ItemColourable"},
{id:299,stringId:"minecraft:leather_chestplate",data:0,name:"Leather Tunic",structure:"ItemColourable"},
{id:300,stringId:"minecraft:leather_leggings",data:0,name:"Leather Pants",structure:"ItemColourable"},
{id:301,stringId:"minecraft:leather_boots",data:0,name:"Leather Boots",structure:"ItemColourable"},
{id:302,stringId:"minecraft:chainmail_helmet",data:0,name:"Chain Helmet"},
{id:303,stringId:"minecraft:chainmail_chestplate",data:0,name:"Chain Chestplate"},
{id:304,stringId:"minecraft:chainmail_leggings",data:0,name:"Chain Leggings"},
{id:305,stringId:"minecraft:chainmail_boots",data:0,name:"Chain Boots"},
{id:306,stringId:"minecraft:iron_helmet",data:0,name:"Iron Helmet"},
{id:307,stringId:"minecraft:iron_chestplate",data:0,name:"Iron Chestplate"},
{id:308,stringId:"minecraft:iron_leggings",data:0,name:"Iron Leggings"},
{id:309,stringId:"minecraft:iron_boots",data:0,name:"Iron Boots"},
{id:310,stringId:"minecraft:diamond_helmet",data:0,name:"Diamond Helmet"},
{id:311,stringId:"minecraft:diamond_chestplate",data:0,name:"Diamond Chestplate"},
{id:312,stringId:"minecraft:diamond_leggings",data:0,name:"Diamond Leggings"},
{id:313,stringId:"minecraft:diamond_boots",data:0,name:"Diamond Boots"},
{id:314,stringId:"minecraft:golden_helmet",data:0,name:"Golden Helmet"},
{id:315,stringId:"minecraft:golden_chestplate",data:0,name:"Golden Chestplate"},
{id:316,stringId:"minecraft:golden_leggings",data:0,name:"Golden Leggings"},
{id:317,stringId:"minecraft:golden_boots",data:0,name:"Golden Boots"},
{id:318,stringId:"minecraft:flint",data:0,name:"Flint"},
{id:319,stringId:"minecraft:porkchop",data:0,name:"Raw Porkchop"},
{id:320,stringId:"minecraft:cooked_porkchop",data:0,name:"Cooked Porkchop"},
{id:321,stringId:"minecraft:painting",data:0,name:"Painting"},
{id:322,stringId:"minecraft:golden_apple",data:0,name:"Golden Apple"},
{id:322,stringId:"minecraft:golden_apple",data:1,name:"Golden Apple"},
{id:323,stringId:"minecraft:sign",data:0,name:"Sign"},
{id:324,stringId:"minecraft:wooden_door",data:0,name:"Wooden Door"},
{id:325,stringId:"minecraft:bucket",data:0,name:"Bucket"},
{id:326,stringId:"minecraft:water_bucket",data:0,name:"Water Bucket"},
{id:327,stringId:"minecraft:lava_bucket",data:0,name:"Lava Bucket"},
{id:328,stringId:"minecraft:minecart",data:0,name:"Minecart"},
{id:329,stringId:"minecraft:saddle",data:0,name:"Saddle"},
{id:330,stringId:"minecraft:iron_door",data:0,name:"Iron Door"},
{id:331,stringId:"minecraft:redstone",data:0,name:"Redstone"},
{id:332,stringId:"minecraft:snowball",data:0,name:"Snowball"},
{id:333,stringId:"minecraft:boat",data:0,name:"Boat"},
{id:334,stringId:"minecraft:leather",data:0,name:"Leather"},
{id:335,stringId:"minecraft:milk_bucket",data:0,name:"Milk"},
{id:336,stringId:"minecraft:brick",data:0,name:"Brick"},
{id:337,stringId:"minecraft:clay_ball",data:0,name:"Clay"},
{id:338,stringId:"minecraft:reeds",data:0,name:"Sugar Canes"},
{id:339,stringId:"minecraft:paper",data:0,name:"Paper"},
{id:340,stringId:"minecraft:book",data:0,name:"Book"},
{id:341,stringId:"minecraft:slime_ball",data:0,name:"Slimeball"},
{id:342,stringId:"minecraft:chest_minecart",data:0,name:"Minecart with Chest"},
{id:343,stringId:"minecraft:furnace_minecart",data:0,name:"Minecart with Furnace"},
{id:344,stringId:"minecraft:egg",data:0,name:"Egg"},
{id:345,stringId:"minecraft:compass",data:0,name:"Compass"},
{id:346,stringId:"minecraft:fishing_rod",data:0,name:"Fishing Rod"},
{id:347,stringId:"minecraft:clock",data:0,name:"Clock"},
{id:348,stringId:"minecraft:glowstone_dust",data:0,name:"Glowstone Dust"},
{id:349,stringId:"minecraft:fish",data:0,name:"Raw Fish"},
{id:350,stringId:"minecraft:cooked_fished",data:0,name:"Cooked Fish"},
{id:351,stringId:"minecraft:dye",data:0,name:"Ink Sac"},
{id:351,stringId:"minecraft:dye",data:1,name:"Rose Red"},
{id:351,stringId:"minecraft:dye",data:2,name:"Cactus Green"},
{id:351,stringId:"minecraft:dye",data:3,name:"Cocoa Beans"},
{id:351,stringId:"minecraft:dye",data:4,name:"Lapis Lazuli"},
{id:351,stringId:"minecraft:dye",data:5,name:"Purple Dye"},
{id:351,stringId:"minecraft:dye",data:6,name:"Cyan Dye"},
{id:351,stringId:"minecraft:dye",data:7,name:"Light Gray Dye"},
{id:351,stringId:"minecraft:dye",data:8,name:"Gray Dye"},
{id:351,stringId:"minecraft:dye",data:9,name:"Pink Dye"},
{id:351,stringId:"minecraft:dye",data:10,name:"Lime Dye"},
{id:351,stringId:"minecraft:dye",data:11,name:"Dandelion Yellow"},
{id:351,stringId:"minecraft:dye",data:12,name:"Light Blue Dye"},
{id:351,stringId:"minecraft:dye",data:13,name:"Magenta Dye"},
{id:351,stringId:"minecraft:dye",data:14,name:"Orange Dye"},
{id:351,stringId:"minecraft:dye",data:15,name:"Bone Meal"},
{id:352,stringId:"minecraft:bone",data:0,name:"Bone"},
{id:353,stringId:"minecraft:sugar",data:0,name:"Sugar"},
{id:354,stringId:"minecraft:cake",data:0,name:"Cake"},
{id:355,stringId:"minecraft:bed",data:0,name:"Bed"},
{id:356,stringId:"minecraft:repeater",data:0,name:"Redstone Repeater"},
{id:357,stringId:"minecraft:cookie",data:0,name:"Cookie"},
{id:358,stringId:"minecraft:filled_map",data:0,name:"Map"},
{id:359,stringId:"minecraft:shears",data:0,name:"Shears"},
{id:360,stringId:"minecraft:melon",data:0,name:"Melon"},
{id:361,stringId:"minecraft:pumpkin_seeds",data:0,name:"Pumpkin Seeds"},
{id:362,stringId:"minecraft:melon_seeds",data:0,name:"Melon Seeds"},
{id:363,stringId:"minecraft:beef",data:0,name:"Raw Beef"},
{id:364,stringId:"minecraft:cooked_beef",data:0,name:"Steak"},
{id:365,stringId:"minecraft:chicken",data:0,name:"Raw Chicken"},
{id:366,stringId:"minecraft:cooked_chicken",data:0,name:"Cooked Chicken"},
{id:367,stringId:"minecraft:rotten_flesh",data:0,name:"Rotten Flesh"},
{id:368,stringId:"minecraft:ender_pearl",data:0,name:"Ender Pearl"},
{id:369,stringId:"minecraft:blaze_rod",data:0,name:"Blaze Rod"},
{id:370,stringId:"minecraft:ghast_tear",data:0,name:"Ghast Tear"},
{id:371,stringId:"minecraft:gold_nugget",data:0,name:"Gold Nugget"},
{id:372,stringId:"minecraft:nether_wart",data:0,name:"Nether Wart"},
{id:373,stringId:"minecraft:potion",data:0,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:8193,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:8225,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:8257,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:16385,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:16417,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:16449,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:8194,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:8226,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:8258,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:16386,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:16418,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:16450,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:8227,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:8259,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:16419,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:16451,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:8196,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:8228,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:8260,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:16388,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:16420,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:16452,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:8261,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:8229,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:16453,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:16421,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:8230,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:8262,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:16422,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:16454,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:8232,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:8264,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:16424,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:16456,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:8201,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:8233,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:8265,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:16393,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:16425,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:16457,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:8234,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:8266,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:16426,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:16458,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:8268,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:8236,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:16460,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:16428,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:8238,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:8270,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:16430,name:"Potion",structure:"ItemPotion"},
{id:373,stringId:"minecraft:potion",data:16462,name:"Potion",structure:"ItemPotion"},
{id:374,stringId:"minecraft:glass_bottle",data:0,name:"Glass Bottle"},
{id:375,stringId:"minecraft:spider_eye",data:0,name:"Spider Eye"},
{id:376,stringId:"minecraft:fermented_spider_eye",data:0,name:"Fermented Spider Eye"},
{id:377,stringId:"minecraft:blaze_powder",data:0,name:"Blaze Powder"},
{id:378,stringId:"minecraft:magma_cream",data:0,name:"Magma Cream"},
{id:379,stringId:"minecraft:brewing_stand",data:0,name:"Brewing Stand"},
{id:380,stringId:"minecraft:cauldron",data:0,name:"Cauldron"},
{id:381,stringId:"minecraft:ender_eye",data:0,name:"Eye of Ender"},
{id:382,stringId:"minecraft:speckled_melon",data:0,name:"Glistering Melon"},
{id:383,stringId:"minecraft:spawn_egg",data:50,name:"Spawn"},
{id:383,stringId:"minecraft:spawn_egg",data:51,name:"Spawn"},
{id:383,stringId:"minecraft:spawn_egg",data:52,name:"Spawn"},
{id:383,stringId:"minecraft:spawn_egg",data:54,name:"Spawn"},
{id:383,stringId:"minecraft:spawn_egg",data:55,name:"Spawn"},
{id:383,stringId:"minecraft:spawn_egg",data:56,name:"Spawn"},
{id:383,stringId:"minecraft:spawn_egg",data:57,name:"Spawn"},
{id:383,stringId:"minecraft:spawn_egg",data:58,name:"Spawn"},
{id:383,stringId:"minecraft:spawn_egg",data:59,name:"Spawn"},
{id:383,stringId:"minecraft:spawn_egg",data:60,name:"Spawn"},
{id:383,stringId:"minecraft:spawn_egg",data:61,name:"Spawn"},
{id:383,stringId:"minecraft:spawn_egg",data:62,name:"Spawn"},
{id:383,stringId:"minecraft:spawn_egg",data:65,name:"Spawn"},
{id:383,stringId:"minecraft:spawn_egg",data:66,name:"Spawn"},
{id:383,stringId:"minecraft:spawn_egg",data:90,name:"Spawn"},
{id:383,stringId:"minecraft:spawn_egg",data:91,name:"Spawn"},
{id:383,stringId:"minecraft:spawn_egg",data:92,name:"Spawn"},
{id:383,stringId:"minecraft:spawn_egg",data:93,name:"Spawn"},
{id:383,stringId:"minecraft:spawn_egg",data:94,name:"Spawn"},
{id:383,stringId:"minecraft:spawn_egg",data:95,name:"Spawn"},
{id:383,stringId:"minecraft:spawn_egg",data:96,name:"Spawn"},
{id:383,stringId:"minecraft:spawn_egg",data:98,name:"Spawn"},
{id:383,stringId:"minecraft:spawn_egg",data:100,name:"Spawn"},
{id:383,stringId:"minecraft:spawn_egg",data:120,name:"Spawn"},
{id:384,stringId:"minecraft:experience_bottle",data:0,name:"Bottle o' Enchanting"},
{id:385,stringId:"minecraft:fire_charge",data:0,name:"Fire Charge"},
{id:386,stringId:"minecraft:writable_book",data:0,name:"Book and Quill",structure:"ItemBookAndQuill"},
{id:387,stringId:"minecraft:written_book",data:0,name:"Written Book",structure:"ItemWrittenBook"},
{id:388,stringId:"minecraft:emerald",data:0,name:"Emerald"},
{id:389,stringId:"minecraft:item_frame",data:0,name:"Item Frame"},
{id:390,stringId:"minecraft:flower_pot",data:0,name:"Flower Pot"},
{id:391,stringId:"minecraft:carrot",data:0,name:"Carrot"},
{id:392,stringId:"minecraft:potato",data:0,name:"Potato"},
{id:393,stringId:"minecraft:baked_potato",data:0,name:"Baked Potato"},
{id:394,stringId:"minecraft:poisonous_potato",data:0,name:"Poisonous Potato"},
{id:395,stringId:"minecraft:map",data:0,name:"Empty Map"},
{id:396,stringId:"minecraft:golden_carrot",data:0,name:"Golden Carrot"},
{id:397,stringId:"minecraft:skull",data:0,name:"Skeleton Skull",structure:"ItemSkull"},
{id:397,stringId:"minecraft:skull",data:1,name:"Wither Skeleton Skull",structure:"ItemSkull"},
{id:397,stringId:"minecraft:skull",data:2,name:"Zombie Head",structure:"ItemSkull"},
{id:397,stringId:"minecraft:skull",data:3,name:"Head",structure:"ItemSkull"},
{id:397,stringId:"minecraft:skull",data:4,name:"Creeper Head",structure:"ItemSkull"},
{id:398,stringId:"minecraft:carrot_on_a_stick",data:0,name:"Carrot on a Stick"},
{id:399,stringId:"minecraft:nether_star",data:0,name:"Nether Star"},
{id:400,stringId:"minecraft:pumpkin_pie",data:0,name:"Pumpkin Pie"},
{id:401,stringId:"minecraft:fireworks",data:0,name:"Firework Rocket",structure:"ItemFirework"},
{id:402,stringId:"minecraft:firework_charge",data:0,name:"Firework Star",structure:"ItemFireworkCharge"},
{id:403,stringId:"minecraft:enchanted_book",data:0,name:"Enchanted Book"},
{id:404,stringId:"minecraft:comparator",data:0,name:"Redstone Comparator"},
{id:405,stringId:"minecraft:netherbrick",data:0,name:"Nether Brick"},
{id:406,stringId:"minecraft:quartz",data:0,name:"Nether Quartz"},
{id:407,stringId:"minecraft:tnt_minecart",data:0,name:"Minecart with TNT"},
{id:408,stringId:"minecraft:hopper_minecart",data:0,name:"Minecart with Hopper"},
{id:417,stringId:"minecraft:iron_horse_armor",data:0,name:"Iron Horse Armor"},
{id:418,stringId:"minecraft:golden_horse_armor",data:0,name:"Gold Horse Armor"},
{id:419,stringId:"minecraft:diamond_horse_armor",data:0,name:"Diamond Horse Armor"},
{id:420,stringId:"minecraft:lead",data:0,name:"Lead"},
{id:421,stringId:"minecraft:name_tag",data:0,name:"Name Tag"},
{id:2256,stringId:"minecraft:record_13",data:0,name:"Music Disc"},
{id:2257,stringId:"minecraft:record_cat",data:0,name:"Music Disc"},
{id:2258,stringId:"minecraft:record_blocks",data:0,name:"Music Disc"},
{id:2259,stringId:"minecraft:record_chirp",data:0,name:"Music Disc"},
{id:2260,stringId:"minecraft:record_far",data:0,name:"Music Disc"},
{id:2261,stringId:"minecraft:record_mall",data:0,name:"Music Disc"},
{id:2262,stringId:"minecraft:record_mellohi",data:0,name:"Music Disc"},
{id:2263,stringId:"minecraft:record_stal",data:0,name:"Music Disc"},
{id:2264,stringId:"minecraft:record_strad",data:0,name:"Music Disc"},
{id:2265,stringId:"minecraft:record_ward",data:0,name:"Music Disc"},
{id:2266,stringId:"minecraft:record_11",data:0,name:"Music Disc"},
{id:2267,stringId:"minecraft:record_wait",data:0,name:"Music Disc"},
{id:174,stringId:"minecraft:packed_ice",data:0,name:"Packed Ice"},
{id:175,stringId:"minecraft:double_plant",data:0,name:"Sunflower"},
{id:175,stringId:"minecraft:double_plant",data:1,name:"Lilac"},
{id:175,stringId:"minecraft:double_plant",data:2,name:"Double Tall Grass"},
{id:175,stringId:"minecraft:double_plant",data:3,name:"Large Fern"},
{id:175,stringId:"minecraft:double_plant",data:4,name:"RoseBush"},
{id:175,stringId:"minecraft:double_plant",data:5,name:"Peony"},
{id:422,stringId:"minecraft:command_block_minecart",data:0,name:"Minecart with Command Block"}
];
/**ACHIEVEMENTS**/
achievements = [
{stringId:"achievement.openInventory",name:"Taking Inventory"},
{stringId:"achievement.mineWood",name:"Getting Wood"},
{stringId:"achievement.buildWorkBench",name:"Benchmarking"},
{stringId:"achievement.buildPickaxe",name:"Time to Mine!"},
{stringId:"achievement.buildFurnace",name:"Hot Topic"},
{stringId:"achievement.acquireIron",name:"Acquire Hardware"},
{stringId:"achievement.buildHoe",name:"Time to Farm!"},
{stringId:"achievement.makeBread",name:"Bake Bread"},
{stringId:"achievement.bakeCake",name:"The Lie"},
{stringId:"achievement.buildBetterPickaxe",name:"Getting an Upgrade"},
{stringId:"achievement.cookFish",name:"Delicious Fish"},
{stringId:"achievement.onARail",name:"On A Rail"},
{stringId:"achievement.buildSword",name:"Time to Strike!"},
{stringId:"achievement.killEnemy",name:"Monster Hunter"},
{stringId:"achievement.killCow",name:"Cow Tipper"},
{stringId:"achievement.flyPig",name:"When Pigs Fly"},
{stringId:"achievement.snipeSkeleton",name:"Sniper Duel"},
{stringId:"achievement.diamonds",name:"DIAMONDS!"},
{stringId:"achievement.portal",name:"We Need to Go Deeper"},
{stringId:"achievement.ghast",name:"Return to Sender"},
{stringId:"achievement.blazeRod",name:"Into Fire"},
{stringId:"achievement.potion",name:"Local Brewery"},
{stringId:"achievement.theEnd",name:"The End?"},
{stringId:"achievement.theEnd2",name:"The End."},
{stringId:"achievement.enchantments",name:"Enchanter"},
{stringId:"achievement.overkill",name:"Overkill"},
{stringId:"achievement.bookcase",name:"Librarian"}
];
/**STATISTICS**/
statistics = [
{stringId:"stat.startGame",name:"Times played"},
{stringId:"stat.createWorld",name:"Worlds created"},
{stringId:"stat.loadWorld",name:"Saves loaded"},
{stringId:"stat.joinMultiplayer",name:"Multiplayer joins"},
{stringId:"stat.leaveGame",name:"Games quit"},
{stringId:"stat.playOneMinute",name:"Minutes Played"},
{stringId:"stat.walkOneCm",name:"Distance Walked"},
{stringId:"stat.swimOneCm",name:"Distance Swum"},
{stringId:"stat.fallOneCm",name:"Distance Fallen"},
{stringId:"stat.climbOneCm",name:"Distance Climbed"},
{stringId:"stat.flyOneCm",name:"Distance Flown"},
{stringId:"stat.diveOneCm",name:"Distance Dove"},
{stringId:"stat.minecartOneCm",name:"Distance by Minecart"},
{stringId:"stat.boatOneCm",name:"Distance by Boat"},
{stringId:"stat.pigOneCm",name:"Distance by Pig"},
{stringId:"stat.jump",name:"Jumps"},
{stringId:"stat.drop",name:"Items Dropped"},
{stringId:"stat.damageDealt",name:"Damage Dealt"},
{stringId:"stat.damageTaken",name:"Damage Taken"},
{stringId:"stat.deaths",name:"Number of Deaths"},
{stringId:"stat.mobKills",name:"Mob Kills"},
{stringId:"stat.playerKills",name:"Player Kills"},
{stringId:"stat.fishCaught",name:"Fish Caught"},
{stringId:"stat.useItem.1",name:"Stone Used"},
{stringId:"stat.useItem.2",name:"Grass Block Used"},
{stringId:"stat.useItem.3",name:"Dirt Used"},
{stringId:"stat.useItem.4",name:"Cobblestone Used"},
{stringId:"stat.useItem.5",name:"Wooden Planks Used"},
{stringId:"stat.useItem.6",name:"tile.sapling.name Used"},
{stringId:"stat.useItem.7",name:"Bedrock Used"},
{stringId:"stat.useItem.8",name:"Water Used"},
{stringId:"stat.useItem.9",name:"Water Used"},
{stringId:"stat.useItem.10",name:"Lava Used"},
{stringId:"stat.useItem.11",name:"Lava Used"},
{stringId:"stat.useItem.12",name:"Sand Used"},
{stringId:"stat.useItem.13",name:"Gravel Used"},
{stringId:"stat.useItem.14",name:"Gold Ore Used"},
{stringId:"stat.useItem.15",name:"Iron Ore Used"},
{stringId:"stat.useItem.16",name:"Coal Ore Used"},
{stringId:"stat.useItem.17",name:"Wood Used"},
{stringId:"stat.useItem.18",name:"Leaves Used"},
{stringId:"stat.useItem.19",name:"Sponge Used"},
{stringId:"stat.useItem.20",name:"Glass Used"},
{stringId:"stat.useItem.21",name:"Lapis Lazuli Ore Used"},
{stringId:"stat.useItem.22",name:"Lapis Lazuli Block Used"},
{stringId:"stat.useItem.23",name:"Dispenser Used"},
{stringId:"stat.useItem.24",name:"Sandstone Used"},
{stringId:"stat.useItem.25",name:"Note Block Used"},
{stringId:"stat.useItem.26",name:"Bed Used"},
{stringId:"stat.useItem.27",name:"Powered Rail Used"},
{stringId:"stat.useItem.28",name:"Detector Rail Used"},
{stringId:"stat.useItem.29",name:"Sticky Piston Used"},
{stringId:"stat.useItem.30",name:"Cobweb Used"},
{stringId:"stat.useItem.31",name:"Grass Used"},
{stringId:"stat.useItem.32",name:"Dead Bush Used"},
{stringId:"stat.useItem.33",name:"Piston Used"},
{stringId:"stat.useItem.34",name:"tile.null.name Used"},
{stringId:"stat.useItem.35",name:"Wool Used"},
{stringId:"stat.useItem.36",name:"tile.null.name Used"},
{stringId:"stat.useItem.37",name:"Flower Used"},
{stringId:"stat.useItem.38",name:"Rose Used"},
{stringId:"stat.useItem.39",name:"Mushroom Used"},
{stringId:"stat.useItem.40",name:"Mushroom Used"},
{stringId:"stat.useItem.41",name:"Block of Gold Used"},
{stringId:"stat.useItem.42",name:"Block of Iron Used"},
{stringId:"stat.useItem.43",name:"tile.stoneSlab.name Used"},
{stringId:"stat.useItem.44",name:"tile.stoneSlab.name Used"},
{stringId:"stat.useItem.45",name:"Bricks Used"},
{stringId:"stat.useItem.46",name:"TNT Used"},
{stringId:"stat.useItem.47",name:"Bookshelf Used"},
{stringId:"stat.useItem.48",name:"Moss Stone Used"},
{stringId:"stat.useItem.49",name:"Obsidian Used"},
{stringId:"stat.useItem.50",name:"Torch Used"},
{stringId:"stat.useItem.51",name:"Fire Used"},
{stringId:"stat.useItem.52",name:"Monster Spawner Used"},
{stringId:"stat.useItem.53",name:"Oak Wood Stairs Used"},
{stringId:"stat.useItem.54",name:"Chest Used"},
{stringId:"stat.useItem.55",name:"Redstone Dust Used"},
{stringId:"stat.useItem.56",name:"Diamond Ore Used"},
{stringId:"stat.useItem.57",name:"Block of Diamond Used"},
{stringId:"stat.useItem.58",name:"Crafting Table Used"},
{stringId:"stat.useItem.59",name:"Crops Used"},
{stringId:"stat.useItem.60",name:"Farmland Used"},
{stringId:"stat.useItem.61",name:"Furnace Used"},
{stringId:"stat.useItem.62",name:"Furnace Used"},
{stringId:"stat.useItem.63",name:"Sign Used"},
{stringId:"stat.useItem.64",name:"Wooden Door Used"},
{stringId:"stat.useItem.65",name:"Ladder Used"},
{stringId:"stat.useItem.66",name:"Rail Used"},
{stringId:"stat.useItem.67",name:"Stone Stairs Used"},
{stringId:"stat.useItem.68",name:"Sign Used"},
{stringId:"stat.useItem.69",name:"Lever Used"},
{stringId:"stat.useItem.70",name:"Pressure Plate Used"},
{stringId:"stat.useItem.71",name:"Iron Door Used"},
{stringId:"stat.useItem.72",name:"Pressure Plate Used"},
{stringId:"stat.useItem.73",name:"Redstone Ore Used"},
{stringId:"stat.useItem.74",name:"Redstone Ore Used"},
{stringId:"stat.useItem.75",name:"Redstone Torch Used"},
{stringId:"stat.useItem.76",name:"Redstone Torch Used"},
{stringId:"stat.useItem.77",name:"Button Used"},
{stringId:"stat.useItem.78",name:"Snow Used"},
{stringId:"stat.useItem.79",name:"Ice Used"},
{stringId:"stat.useItem.80",name:"Snow Used"},
{stringId:"stat.useItem.81",name:"Cactus Used"},
{stringId:"stat.useItem.82",name:"Clay Used"},
{stringId:"stat.useItem.83",name:"Sugar cane Used"},
{stringId:"stat.useItem.84",name:"Jukebox Used"},
{stringId:"stat.useItem.85",name:"Fence Used"},
{stringId:"stat.useItem.86",name:"Pumpkin Used"},
{stringId:"stat.useItem.87",name:"Netherrack Used"},
{stringId:"stat.useItem.88",name:"Soul Sand Used"},
{stringId:"stat.useItem.89",name:"Glowstone Used"},
{stringId:"stat.useItem.90",name:"Portal Used"},
{stringId:"stat.useItem.91",name:"Jack o'Lantern Used"},
{stringId:"stat.useItem.92",name:"Cake Used"},
{stringId:"stat.useItem.93",name:"tile.diode.name Used"},
{stringId:"stat.useItem.94",name:"tile.diode.name Used"},
{stringId:"stat.useItem.95",name:"Locked chest Used"},
{stringId:"stat.useItem.96",name:"Trapdoor Used"},
{stringId:"stat.useItem.97",name:"tile.monsterStoneEgg.name Used"},
{stringId:"stat.useItem.98",name:"Stone Bricks Used"},
{stringId:"stat.useItem.99",name:"Mushroom Used"},
{stringId:"stat.useItem.100",name:"Mushroom Used"},
{stringId:"stat.useItem.101",name:"Iron Bars Used"},
{stringId:"stat.useItem.102",name:"Glass Pane Used"},
{stringId:"stat.useItem.103",name:"Melon Used"},
{stringId:"stat.useItem.104",name:"tile.pumpkinStem.name Used"},
{stringId:"stat.useItem.105",name:"tile.pumpkinStem.name Used"},
{stringId:"stat.useItem.106",name:"Vines Used"},
{stringId:"stat.useItem.107",name:"Fence Gate Used"},
{stringId:"stat.useItem.108",name:"Brick Stairs Used"},
{stringId:"stat.useItem.109",name:"Stone Brick Stairs Used"},
{stringId:"stat.useItem.110",name:"Mycelium Used"},
{stringId:"stat.useItem.111",name:"Lily Pad Used"},
{stringId:"stat.useItem.112",name:"Nether Brick Used"},
{stringId:"stat.useItem.113",name:"Nether Brick Fence Used"},
{stringId:"stat.useItem.114",name:"Nether Brick Stairs Used"},
{stringId:"stat.useItem.115",name:"Nether Wart Used"},
{stringId:"stat.useItem.116",name:"Enchantment Table Used"},
{stringId:"stat.useItem.117",name:"tile.brewingStand.name Used"},
{stringId:"stat.useItem.118",name:"Cauldron Used"},
{stringId:"stat.useItem.119",name:"tile.null.name Used"},
{stringId:"stat.useItem.120",name:"End Portal Used"},
{stringId:"stat.useItem.121",name:"End Stone Used"},
{stringId:"stat.useItem.122",name:"Dragon Egg Used"},
{stringId:"stat.useItem.123",name:"Redstone Lamp Used"},
{stringId:"stat.useItem.124",name:"Redstone Lamp Used"},
{stringId:"stat.useItem.125",name:"tile.woodSlab.name Used"},
{stringId:"stat.useItem.126",name:"tile.woodSlab.name Used"},
{stringId:"stat.useItem.127",name:"Cocoa Used"},
{stringId:"stat.useItem.128",name:"Sandstone Stairs Used"},
{stringId:"stat.useItem.129",name:"Emerald Ore Used"},
{stringId:"stat.useItem.130",name:"Ender Chest Used"},
{stringId:"stat.useItem.131",name:"Tripwire Hook Used"},
{stringId:"stat.useItem.132",name:"Tripwire Used"},
{stringId:"stat.useItem.133",name:"Block of Emerald Used"},
{stringId:"stat.useItem.134",name:"Spruce Wood Stairs Used"},
{stringId:"stat.useItem.135",name:"Birch Wood Stairs Used"},
{stringId:"stat.useItem.136",name:"Jungle Wood Stairs Used"},
{stringId:"stat.useItem.137",name:"Command Block Used"},
{stringId:"stat.useItem.138",name:"Beacon Used"},
{stringId:"stat.useItem.139",name:"tile.cobbleWall.name Used"},
{stringId:"stat.useItem.140",name:"tile.flowerPot.name Used"},
{stringId:"stat.useItem.141",name:"Carrots Used"},
{stringId:"stat.useItem.142",name:"Potatoes Used"},
{stringId:"stat.useItem.143",name:"Button Used"},
{stringId:"stat.useItem.144",name:"tile.skull.name Used"},
{stringId:"stat.useItem.145",name:"Anvil Used"},
{stringId:"stat.useItem.146",name:"Trapped Chest Used"},
{stringId:"stat.useItem.147",name:"Weighted Pressure Plate (Light) Used"},
{stringId:"stat.useItem.148",name:"Weighted Pressure Plate (Heavy) Used"},
{stringId:"stat.useItem.149",name:"tile.comparator.name Used"},
{stringId:"stat.useItem.150",name:"tile.comparator.name Used"},
{stringId:"stat.useItem.151",name:"Daylight Sensor Used"},
{stringId:"stat.useItem.152",name:"Block of Redstone Used"},
{stringId:"stat.useItem.153",name:"Nether Quartz Ore Used"},
{stringId:"stat.useItem.154",name:"Hopper Used"},
{stringId:"stat.useItem.155",name:"tile.quartzBlock.name Used"},
{stringId:"stat.useItem.156",name:"Quartz Stairs Used"},
{stringId:"stat.useItem.157",name:"Activator Rail Used"},
{stringId:"stat.useItem.158",name:"Dropper Used"},
{stringId:"stat.useItem.159",name:"tile.clayHardenedStained.name Used"},
{stringId:"stat.useItem.170",name:"Hay Bale Used"},
{stringId:"stat.useItem.171",name:"tile.woolCarpet.name Used"},
{stringId:"stat.useItem.172",name:"Hardened Clay Used"},
{stringId:"stat.useItem.173",name:"Block of Coal Used"},
{stringId:"stat.useItem.256",name:"Iron Shovel Used"},
{stringId:"stat.useItem.257",name:"Iron Pickaxe Used"},
{stringId:"stat.useItem.258",name:"Iron Axe Used"},
{stringId:"stat.useItem.259",name:"Flint and Steel Used"},
{stringId:"stat.useItem.260",name:"Apple Used"},
{stringId:"stat.useItem.261",name:"Bow Used"},
{stringId:"stat.useItem.262",name:"Arrow Used"},
{stringId:"stat.useItem.263",name:"Coal Used"},
{stringId:"stat.useItem.264",name:"Diamond Used"},
{stringId:"stat.useItem.265",name:"Iron Ingot Used"},
{stringId:"stat.useItem.266",name:"Gold Ingot Used"},
{stringId:"stat.useItem.267",name:"Iron Sword Used"},
{stringId:"stat.useItem.268",name:"Wooden Sword Used"},
{stringId:"stat.useItem.269",name:"Wooden Shovel Used"},
{stringId:"stat.useItem.270",name:"Wooden Pickaxe Used"},
{stringId:"stat.useItem.271",name:"Wooden Axe Used"},
{stringId:"stat.useItem.272",name:"Stone Sword Used"},
{stringId:"stat.useItem.273",name:"Stone Shovel Used"},
{stringId:"stat.useItem.274",name:"Stone Pickaxe Used"},
{stringId:"stat.useItem.275",name:"Stone Axe Used"},
{stringId:"stat.useItem.276",name:"Diamond Sword Used"},
{stringId:"stat.useItem.277",name:"Diamond Shovel Used"},
{stringId:"stat.useItem.278",name:"Diamond Pickaxe Used"},
{stringId:"stat.useItem.279",name:"Diamond Axe Used"},
{stringId:"stat.useItem.280",name:"Stick Used"},
{stringId:"stat.useItem.281",name:"Bowl Used"},
{stringId:"stat.useItem.282",name:"Mushroom Stew Used"},
{stringId:"stat.useItem.283",name:"Golden Sword Used"},
{stringId:"stat.useItem.284",name:"Golden Shovel Used"},
{stringId:"stat.useItem.285",name:"Golden Pickaxe Used"},
{stringId:"stat.useItem.286",name:"Golden Axe Used"},
{stringId:"stat.useItem.287",name:"String Used"},
{stringId:"stat.useItem.288",name:"Feather Used"},
{stringId:"stat.useItem.289",name:"Gunpowder Used"},
{stringId:"stat.useItem.290",name:"Wooden Hoe Used"},
{stringId:"stat.useItem.291",name:"Stone Hoe Used"},
{stringId:"stat.useItem.292",name:"Iron Hoe Used"},
{stringId:"stat.useItem.293",name:"Diamond Hoe Used"},
{stringId:"stat.useItem.294",name:"Golden Hoe Used"},
{stringId:"stat.useItem.295",name:"Seeds Used"},
{stringId:"stat.useItem.296",name:"Wheat Used"},
{stringId:"stat.useItem.297",name:"Bread Used"},
{stringId:"stat.useItem.298",name:"Leather Cap Used"},
{stringId:"stat.useItem.299",name:"Leather Tunic Used"},
{stringId:"stat.useItem.300",name:"Leather Pants Used"},
{stringId:"stat.useItem.301",name:"Leather Boots Used"},
{stringId:"stat.useItem.302",name:"Chain Helmet Used"},
{stringId:"stat.useItem.303",name:"Chain Chestplate Used"},
{stringId:"stat.useItem.304",name:"Chain Leggings Used"},
{stringId:"stat.useItem.305",name:"Chain Boots Used"},
{stringId:"stat.useItem.306",name:"Iron Helmet Used"},
{stringId:"stat.useItem.307",name:"Iron Chestplate Used"},
{stringId:"stat.useItem.308",name:"Iron Leggings Used"},
{stringId:"stat.useItem.309",name:"Iron Boots Used"},
{stringId:"stat.useItem.310",name:"Diamond Helmet Used"},
{stringId:"stat.useItem.311",name:"Diamond Chestplate Used"},
{stringId:"stat.useItem.312",name:"Diamond Leggings Used"},
{stringId:"stat.useItem.313",name:"Diamond Boots Used"},
{stringId:"stat.useItem.314",name:"Golden Helmet Used"},
{stringId:"stat.useItem.315",name:"Golden Chestplate Used"},
{stringId:"stat.useItem.316",name:"Golden Leggings Used"},
{stringId:"stat.useItem.317",name:"Golden Boots Used"},
{stringId:"stat.useItem.318",name:"Flint Used"},
{stringId:"stat.useItem.319",name:"Raw Porkchop Used"},
{stringId:"stat.useItem.320",name:"Cooked Porkchop Used"},
{stringId:"stat.useItem.321",name:"Painting Used"},
{stringId:"stat.useItem.322",name:"Golden Apple Used"},
{stringId:"stat.useItem.323",name:"Sign Used"},
{stringId:"stat.useItem.324",name:"Wooden Door Used"},
{stringId:"stat.useItem.325",name:"Bucket Used"},
{stringId:"stat.useItem.326",name:"Water Bucket Used"},
{stringId:"stat.useItem.327",name:"Lava Bucket Used"},
{stringId:"stat.useItem.328",name:"Minecart Used"},
{stringId:"stat.useItem.329",name:"Saddle Used"},
{stringId:"stat.useItem.330",name:"Iron Door Used"},
{stringId:"stat.useItem.331",name:"Redstone Used"},
{stringId:"stat.useItem.332",name:"Snowball Used"},
{stringId:"stat.useItem.333",name:"Boat Used"},
{stringId:"stat.useItem.334",name:"Leather Used"},
{stringId:"stat.useItem.335",name:"Milk Used"},
{stringId:"stat.useItem.336",name:"Brick Used"},
{stringId:"stat.useItem.337",name:"Clay Used"},
{stringId:"stat.useItem.338",name:"Sugar Canes Used"},
{stringId:"stat.useItem.339",name:"Paper Used"},
{stringId:"stat.useItem.340",name:"Book Used"},
{stringId:"stat.useItem.341",name:"Slimeball Used"},
{stringId:"stat.useItem.342",name:"Minecart with Chest Used"},
{stringId:"stat.useItem.343",name:"Minecart with Furnace Used"},
{stringId:"stat.useItem.344",name:"Egg Used"},
{stringId:"stat.useItem.345",name:"Compass Used"},
{stringId:"stat.useItem.346",name:"Fishing Rod Used"},
{stringId:"stat.useItem.347",name:"Clock Used"},
{stringId:"stat.useItem.348",name:"Glowstone Dust Used"},
{stringId:"stat.useItem.349",name:"Raw Fish Used"},
{stringId:"stat.useItem.350",name:"Cooked Fish Used"},
{stringId:"stat.useItem.351",name:"item.dyePowder.name Used"},
{stringId:"stat.useItem.352",name:"Bone Used"},
{stringId:"stat.useItem.353",name:"Sugar Used"},
{stringId:"stat.useItem.354",name:"Cake Used"},
{stringId:"stat.useItem.355",name:"Bed Used"},
{stringId:"stat.useItem.356",name:"Redstone Repeater Used"},
{stringId:"stat.useItem.357",name:"Cookie Used"},
{stringId:"stat.useItem.358",name:"Map Used"},
{stringId:"stat.useItem.359",name:"Shears Used"},
{stringId:"stat.useItem.360",name:"Melon Used"},
{stringId:"stat.useItem.361",name:"Pumpkin Seeds Used"},
{stringId:"stat.useItem.362",name:"Melon Seeds Used"},
{stringId:"stat.useItem.363",name:"Raw Beef Used"},
{stringId:"stat.useItem.364",name:"Steak Used"},
{stringId:"stat.useItem.365",name:"Raw Chicken Used"},
{stringId:"stat.useItem.366",name:"Cooked Chicken Used"},
{stringId:"stat.useItem.367",name:"Rotten Flesh Used"},
{stringId:"stat.useItem.368",name:"Ender Pearl Used"},
{stringId:"stat.useItem.369",name:"Blaze Rod Used"},
{stringId:"stat.useItem.370",name:"Ghast Tear Used"},
{stringId:"stat.useItem.371",name:"Gold Nugget Used"},
{stringId:"stat.useItem.372",name:"Nether Wart Used"},
{stringId:"stat.useItem.373",name:"Potion Used"},
{stringId:"stat.useItem.374",name:"Glass Bottle Used"},
{stringId:"stat.useItem.375",name:"Spider Eye Used"},
{stringId:"stat.useItem.376",name:"Fermented Spider Eye Used"},
{stringId:"stat.useItem.377",name:"Blaze Powder Used"},
{stringId:"stat.useItem.378",name:"Magma Cream Used"},
{stringId:"stat.useItem.379",name:"Brewing Stand Used"},
{stringId:"stat.useItem.380",name:"Cauldron Used"},
{stringId:"stat.useItem.381",name:"Eye of Ender Used"},
{stringId:"stat.useItem.382",name:"Glistering Melon Used"},
{stringId:"stat.useItem.383",name:"Spawn Used"},
{stringId:"stat.useItem.384",name:"Bottle o' Enchanting Used"},
{stringId:"stat.useItem.385",name:"Fire Charge Used"},
{stringId:"stat.useItem.386",name:"Book and Quill Used"},
{stringId:"stat.useItem.387",name:"Written Book Used"},
{stringId:"stat.useItem.388",name:"Emerald Used"},
{stringId:"stat.useItem.389",name:"Item Frame Used"},
{stringId:"stat.useItem.390",name:"Flower Pot Used"},
{stringId:"stat.useItem.391",name:"Carrot Used"},
{stringId:"stat.useItem.392",name:"Potato Used"},
{stringId:"stat.useItem.393",name:"Baked Potato Used"},
{stringId:"stat.useItem.394",name:"Poisonous Potato Used"},
{stringId:"stat.useItem.395",name:"Empty Map Used"},
{stringId:"stat.useItem.396",name:"Golden Carrot Used"},
{stringId:"stat.useItem.397",name:"item.skull.name Used"},
{stringId:"stat.useItem.398",name:"Carrot on a Stick Used"},
{stringId:"stat.useItem.399",name:"Nether Star Used"},
{stringId:"stat.useItem.400",name:"Pumpkin Pie Used"},
{stringId:"stat.useItem.401",name:"Firework Rocket Used"},
{stringId:"stat.useItem.402",name:"Firework Star Used"},
{stringId:"stat.useItem.403",name:"Enchanted Book Used"},
{stringId:"stat.useItem.404",name:"Redstone Comparator Used"},
{stringId:"stat.useItem.405",name:"Nether Brick Used"},
{stringId:"stat.useItem.406",name:"Nether Quartz Used"},
{stringId:"stat.useItem.407",name:"Minecart with TNT Used"},
{stringId:"stat.useItem.408",name:"Minecart with Hopper Used"},
{stringId:"stat.useItem.417",name:"Iron Horse Armor Used"},
{stringId:"stat.useItem.418",name:"Gold Horse Armor Used"},
{stringId:"stat.useItem.419",name:"Diamond Horse Armor Used"},
{stringId:"stat.useItem.420",name:"Lead Used"},
{stringId:"stat.useItem.421",name:"Name Tag Used"},
{stringId:"stat.useItem.2256",name:"Music Disc Used"},
{stringId:"stat.useItem.2257",name:"Music Disc Used"},
{stringId:"stat.useItem.2258",name:"Music Disc Used"},
{stringId:"stat.useItem.2259",name:"Music Disc Used"},
{stringId:"stat.useItem.2260",name:"Music Disc Used"},
{stringId:"stat.useItem.2261",name:"Music Disc Used"},
{stringId:"stat.useItem.2262",name:"Music Disc Used"},
{stringId:"stat.useItem.2263",name:"Music Disc Used"},
{stringId:"stat.useItem.2264",name:"Music Disc Used"},
{stringId:"stat.useItem.2265",name:"Music Disc Used"},
{stringId:"stat.useItem.2266",name:"Music Disc Used"},
{stringId:"stat.useItem.2267",name:"Music Disc Used"},
{stringId:"stat.breakItem.1",name:"Stone Depleted"},
{stringId:"stat.breakItem.2",name:"Grass Block Depleted"},
{stringId:"stat.breakItem.3",name:"Dirt Depleted"},
{stringId:"stat.breakItem.4",name:"Cobblestone Depleted"},
{stringId:"stat.breakItem.5",name:"Wooden Planks Depleted"},
{stringId:"stat.breakItem.6",name:"tile.sapling.name Depleted"},
{stringId:"stat.breakItem.7",name:"Bedrock Depleted"},
{stringId:"stat.breakItem.8",name:"Water Depleted"},
{stringId:"stat.breakItem.9",name:"Water Depleted"},
{stringId:"stat.breakItem.10",name:"Lava Depleted"},
{stringId:"stat.breakItem.11",name:"Lava Depleted"},
{stringId:"stat.breakItem.12",name:"Sand Depleted"},
{stringId:"stat.breakItem.13",name:"Gravel Depleted"},
{stringId:"stat.breakItem.14",name:"Gold Ore Depleted"},
{stringId:"stat.breakItem.15",name:"Iron Ore Depleted"},
{stringId:"stat.breakItem.16",name:"Coal Ore Depleted"},
{stringId:"stat.breakItem.17",name:"Wood Depleted"},
{stringId:"stat.breakItem.18",name:"Leaves Depleted"},
{stringId:"stat.breakItem.19",name:"Sponge Depleted"},
{stringId:"stat.breakItem.20",name:"Glass Depleted"},
{stringId:"stat.breakItem.21",name:"Lapis Lazuli Ore Depleted"},
{stringId:"stat.breakItem.22",name:"Lapis Lazuli Block Depleted"},
{stringId:"stat.breakItem.23",name:"Dispenser Depleted"},
{stringId:"stat.breakItem.24",name:"Sandstone Depleted"},
{stringId:"stat.breakItem.25",name:"Note Block Depleted"},
{stringId:"stat.breakItem.26",name:"Bed Depleted"},
{stringId:"stat.breakItem.27",name:"Powered Rail Depleted"},
{stringId:"stat.breakItem.28",name:"Detector Rail Depleted"},
{stringId:"stat.breakItem.29",name:"Sticky Piston Depleted"},
{stringId:"stat.breakItem.30",name:"Cobweb Depleted"},
{stringId:"stat.breakItem.31",name:"Grass Depleted"},
{stringId:"stat.breakItem.32",name:"Dead Bush Depleted"},
{stringId:"stat.breakItem.33",name:"Piston Depleted"},
{stringId:"stat.breakItem.34",name:"tile.null.name Depleted"},
{stringId:"stat.breakItem.35",name:"Wool Depleted"},
{stringId:"stat.breakItem.36",name:"tile.null.name Depleted"},
{stringId:"stat.breakItem.37",name:"Flower Depleted"},
{stringId:"stat.breakItem.38",name:"Rose Depleted"},
{stringId:"stat.breakItem.39",name:"Mushroom Depleted"},
{stringId:"stat.breakItem.40",name:"Mushroom Depleted"},
{stringId:"stat.breakItem.41",name:"Block of Gold Depleted"},
{stringId:"stat.breakItem.42",name:"Block of Iron Depleted"},
{stringId:"stat.breakItem.43",name:"tile.stoneSlab.name Depleted"},
{stringId:"stat.breakItem.44",name:"tile.stoneSlab.name Depleted"},
{stringId:"stat.breakItem.45",name:"Bricks Depleted"},
{stringId:"stat.breakItem.46",name:"TNT Depleted"},
{stringId:"stat.breakItem.47",name:"Bookshelf Depleted"},
{stringId:"stat.breakItem.48",name:"Moss Stone Depleted"},
{stringId:"stat.breakItem.49",name:"Obsidian Depleted"},
{stringId:"stat.breakItem.50",name:"Torch Depleted"},
{stringId:"stat.breakItem.51",name:"Fire Depleted"},
{stringId:"stat.breakItem.52",name:"Monster Spawner Depleted"},
{stringId:"stat.breakItem.53",name:"Oak Wood Stairs Depleted"},
{stringId:"stat.breakItem.54",name:"Chest Depleted"},
{stringId:"stat.breakItem.55",name:"Redstone Dust Depleted"},
{stringId:"stat.breakItem.56",name:"Diamond Ore Depleted"},
{stringId:"stat.breakItem.57",name:"Block of Diamond Depleted"},
{stringId:"stat.breakItem.58",name:"Crafting Table Depleted"},
{stringId:"stat.breakItem.59",name:"Crops Depleted"},
{stringId:"stat.breakItem.60",name:"Farmland Depleted"},
{stringId:"stat.breakItem.61",name:"Furnace Depleted"},
{stringId:"stat.breakItem.62",name:"Furnace Depleted"},
{stringId:"stat.breakItem.63",name:"Sign Depleted"},
{stringId:"stat.breakItem.64",name:"Wooden Door Depleted"},
{stringId:"stat.breakItem.65",name:"Ladder Depleted"},
{stringId:"stat.breakItem.66",name:"Rail Depleted"},
{stringId:"stat.breakItem.67",name:"Stone Stairs Depleted"},
{stringId:"stat.breakItem.68",name:"Sign Depleted"},
{stringId:"stat.breakItem.69",name:"Lever Depleted"},
{stringId:"stat.breakItem.70",name:"Pressure Plate Depleted"},
{stringId:"stat.breakItem.71",name:"Iron Door Depleted"},
{stringId:"stat.breakItem.72",name:"Pressure Plate Depleted"},
{stringId:"stat.breakItem.73",name:"Redstone Ore Depleted"},
{stringId:"stat.breakItem.74",name:"Redstone Ore Depleted"},
{stringId:"stat.breakItem.75",name:"Redstone Torch Depleted"},
{stringId:"stat.breakItem.76",name:"Redstone Torch Depleted"},
{stringId:"stat.breakItem.77",name:"Button Depleted"},
{stringId:"stat.breakItem.78",name:"Snow Depleted"},
{stringId:"stat.breakItem.79",name:"Ice Depleted"},
{stringId:"stat.breakItem.80",name:"Snow Depleted"},
{stringId:"stat.breakItem.81",name:"Cactus Depleted"},
{stringId:"stat.breakItem.82",name:"Clay Depleted"},
{stringId:"stat.breakItem.83",name:"Sugar cane Depleted"},
{stringId:"stat.breakItem.84",name:"Jukebox Depleted"},
{stringId:"stat.breakItem.85",name:"Fence Depleted"},
{stringId:"stat.breakItem.86",name:"Pumpkin Depleted"},
{stringId:"stat.breakItem.87",name:"Netherrack Depleted"},
{stringId:"stat.breakItem.88",name:"Soul Sand Depleted"},
{stringId:"stat.breakItem.89",name:"Glowstone Depleted"},
{stringId:"stat.breakItem.90",name:"Portal Depleted"},
{stringId:"stat.breakItem.91",name:"Jack o'Lantern Depleted"},
{stringId:"stat.breakItem.92",name:"Cake Depleted"},
{stringId:"stat.breakItem.93",name:"tile.diode.name Depleted"},
{stringId:"stat.breakItem.94",name:"tile.diode.name Depleted"},
{stringId:"stat.breakItem.95",name:"Locked chest Depleted"},
{stringId:"stat.breakItem.96",name:"Trapdoor Depleted"},
{stringId:"stat.breakItem.97",name:"tile.monsterStoneEgg.name Depleted"},
{stringId:"stat.breakItem.98",name:"Stone Bricks Depleted"},
{stringId:"stat.breakItem.99",name:"Mushroom Depleted"},
{stringId:"stat.breakItem.100",name:"Mushroom Depleted"},
{stringId:"stat.breakItem.101",name:"Iron Bars Depleted"},
{stringId:"stat.breakItem.102",name:"Glass Pane Depleted"},
{stringId:"stat.breakItem.103",name:"Melon Depleted"},
{stringId:"stat.breakItem.104",name:"tile.pumpkinStem.name Depleted"},
{stringId:"stat.breakItem.105",name:"tile.pumpkinStem.name Depleted"},
{stringId:"stat.breakItem.106",name:"Vines Depleted"},
{stringId:"stat.breakItem.107",name:"Fence Gate Depleted"},
{stringId:"stat.breakItem.108",name:"Brick Stairs Depleted"},
{stringId:"stat.breakItem.109",name:"Stone Brick Stairs Depleted"},
{stringId:"stat.breakItem.110",name:"Mycelium Depleted"},
{stringId:"stat.breakItem.111",name:"Lily Pad Depleted"},
{stringId:"stat.breakItem.112",name:"Nether Brick Depleted"},
{stringId:"stat.breakItem.113",name:"Nether Brick Fence Depleted"},
{stringId:"stat.breakItem.114",name:"Nether Brick Stairs Depleted"},
{stringId:"stat.breakItem.115",name:"Nether Wart Depleted"},
{stringId:"stat.breakItem.116",name:"Enchantment Table Depleted"},
{stringId:"stat.breakItem.117",name:"tile.brewingStand.name Depleted"},
{stringId:"stat.breakItem.118",name:"Cauldron Depleted"},
{stringId:"stat.breakItem.119",name:"tile.null.name Depleted"},
{stringId:"stat.breakItem.120",name:"End Portal Depleted"},
{stringId:"stat.breakItem.121",name:"End Stone Depleted"},
{stringId:"stat.breakItem.122",name:"Dragon Egg Depleted"},
{stringId:"stat.breakItem.123",name:"Redstone Lamp Depleted"},
{stringId:"stat.breakItem.124",name:"Redstone Lamp Depleted"},
{stringId:"stat.breakItem.125",name:"tile.woodSlab.name Depleted"},
{stringId:"stat.breakItem.126",name:"tile.woodSlab.name Depleted"},
{stringId:"stat.breakItem.127",name:"Cocoa Depleted"},
{stringId:"stat.breakItem.128",name:"Sandstone Stairs Depleted"},
{stringId:"stat.breakItem.129",name:"Emerald Ore Depleted"},
{stringId:"stat.breakItem.130",name:"Ender Chest Depleted"},
{stringId:"stat.breakItem.131",name:"Tripwire Hook Depleted"},
{stringId:"stat.breakItem.132",name:"Tripwire Depleted"},
{stringId:"stat.breakItem.133",name:"Block of Emerald Depleted"},
{stringId:"stat.breakItem.134",name:"Spruce Wood Stairs Depleted"},
{stringId:"stat.breakItem.135",name:"Birch Wood Stairs Depleted"},
{stringId:"stat.breakItem.136",name:"Jungle Wood Stairs Depleted"},
{stringId:"stat.breakItem.137",name:"Command Block Depleted"},
{stringId:"stat.breakItem.138",name:"Beacon Depleted"},
{stringId:"stat.breakItem.139",name:"tile.cobbleWall.name Depleted"},
{stringId:"stat.breakItem.140",name:"tile.flowerPot.name Depleted"},
{stringId:"stat.breakItem.141",name:"Carrots Depleted"},
{stringId:"stat.breakItem.142",name:"Potatoes Depleted"},
{stringId:"stat.breakItem.143",name:"Button Depleted"},
{stringId:"stat.breakItem.144",name:"tile.skull.name Depleted"},
{stringId:"stat.breakItem.145",name:"Anvil Depleted"},
{stringId:"stat.breakItem.146",name:"Trapped Chest Depleted"},
{stringId:"stat.breakItem.147",name:"Weighted Pressure Plate (Light) Depleted"},
{stringId:"stat.breakItem.148",name:"Weighted Pressure Plate (Heavy) Depleted"},
{stringId:"stat.breakItem.149",name:"tile.comparator.name Depleted"},
{stringId:"stat.breakItem.150",name:"tile.comparator.name Depleted"},
{stringId:"stat.breakItem.151",name:"Daylight Sensor Depleted"},
{stringId:"stat.breakItem.152",name:"Block of Redstone Depleted"},
{stringId:"stat.breakItem.153",name:"Nether Quartz Ore Depleted"},
{stringId:"stat.breakItem.154",name:"Hopper Depleted"},
{stringId:"stat.breakItem.155",name:"tile.quartzBlock.name Depleted"},
{stringId:"stat.breakItem.156",name:"Quartz Stairs Depleted"},
{stringId:"stat.breakItem.157",name:"Activator Rail Depleted"},
{stringId:"stat.breakItem.158",name:"Dropper Depleted"},
{stringId:"stat.breakItem.159",name:"tile.clayHardenedStained.name Depleted"},
{stringId:"stat.breakItem.170",name:"Hay Bale Depleted"},
{stringId:"stat.breakItem.171",name:"tile.woolCarpet.name Depleted"},
{stringId:"stat.breakItem.172",name:"Hardened Clay Depleted"},
{stringId:"stat.breakItem.173",name:"Block of Coal Depleted"},
{stringId:"stat.breakItem.256",name:"Iron Shovel Depleted"},
{stringId:"stat.breakItem.257",name:"Iron Pickaxe Depleted"},
{stringId:"stat.breakItem.258",name:"Iron Axe Depleted"},
{stringId:"stat.breakItem.259",name:"Flint and Steel Depleted"},
{stringId:"stat.breakItem.260",name:"Apple Depleted"},
{stringId:"stat.breakItem.261",name:"Bow Depleted"},
{stringId:"stat.breakItem.262",name:"Arrow Depleted"},
{stringId:"stat.breakItem.263",name:"Coal Depleted"},
{stringId:"stat.breakItem.264",name:"Diamond Depleted"},
{stringId:"stat.breakItem.265",name:"Iron Ingot Depleted"},
{stringId:"stat.breakItem.266",name:"Gold Ingot Depleted"},
{stringId:"stat.breakItem.267",name:"Iron Sword Depleted"},
{stringId:"stat.breakItem.268",name:"Wooden Sword Depleted"},
{stringId:"stat.breakItem.269",name:"Wooden Shovel Depleted"},
{stringId:"stat.breakItem.270",name:"Wooden Pickaxe Depleted"},
{stringId:"stat.breakItem.271",name:"Wooden Axe Depleted"},
{stringId:"stat.breakItem.272",name:"Stone Sword Depleted"},
{stringId:"stat.breakItem.273",name:"Stone Shovel Depleted"},
{stringId:"stat.breakItem.274",name:"Stone Pickaxe Depleted"},
{stringId:"stat.breakItem.275",name:"Stone Axe Depleted"},
{stringId:"stat.breakItem.276",name:"Diamond Sword Depleted"},
{stringId:"stat.breakItem.277",name:"Diamond Shovel Depleted"},
{stringId:"stat.breakItem.278",name:"Diamond Pickaxe Depleted"},
{stringId:"stat.breakItem.279",name:"Diamond Axe Depleted"},
{stringId:"stat.breakItem.280",name:"Stick Depleted"},
{stringId:"stat.breakItem.281",name:"Bowl Depleted"},
{stringId:"stat.breakItem.282",name:"Mushroom Stew Depleted"},
{stringId:"stat.breakItem.283",name:"Golden Sword Depleted"},
{stringId:"stat.breakItem.284",name:"Golden Shovel Depleted"},
{stringId:"stat.breakItem.285",name:"Golden Pickaxe Depleted"},
{stringId:"stat.breakItem.286",name:"Golden Axe Depleted"},
{stringId:"stat.breakItem.287",name:"String Depleted"},
{stringId:"stat.breakItem.288",name:"Feather Depleted"},
{stringId:"stat.breakItem.289",name:"Gunpowder Depleted"},
{stringId:"stat.breakItem.290",name:"Wooden Hoe Depleted"},
{stringId:"stat.breakItem.291",name:"Stone Hoe Depleted"},
{stringId:"stat.breakItem.292",name:"Iron Hoe Depleted"},
{stringId:"stat.breakItem.293",name:"Diamond Hoe Depleted"},
{stringId:"stat.breakItem.294",name:"Golden Hoe Depleted"},
{stringId:"stat.breakItem.295",name:"Seeds Depleted"},
{stringId:"stat.breakItem.296",name:"Wheat Depleted"},
{stringId:"stat.breakItem.297",name:"Bread Depleted"},
{stringId:"stat.breakItem.298",name:"Leather Cap Depleted"},
{stringId:"stat.breakItem.299",name:"Leather Tunic Depleted"},
{stringId:"stat.breakItem.300",name:"Leather Pants Depleted"},
{stringId:"stat.breakItem.301",name:"Leather Boots Depleted"},
{stringId:"stat.breakItem.302",name:"Chain Helmet Depleted"},
{stringId:"stat.breakItem.303",name:"Chain Chestplate Depleted"},
{stringId:"stat.breakItem.304",name:"Chain Leggings Depleted"},
{stringId:"stat.breakItem.305",name:"Chain Boots Depleted"},
{stringId:"stat.breakItem.306",name:"Iron Helmet Depleted"},
{stringId:"stat.breakItem.307",name:"Iron Chestplate Depleted"},
{stringId:"stat.breakItem.308",name:"Iron Leggings Depleted"},
{stringId:"stat.breakItem.309",name:"Iron Boots Depleted"},
{stringId:"stat.breakItem.310",name:"Diamond Helmet Depleted"},
{stringId:"stat.breakItem.311",name:"Diamond Chestplate Depleted"},
{stringId:"stat.breakItem.312",name:"Diamond Leggings Depleted"},
{stringId:"stat.breakItem.313",name:"Diamond Boots Depleted"},
{stringId:"stat.breakItem.314",name:"Golden Helmet Depleted"},
{stringId:"stat.breakItem.315",name:"Golden Chestplate Depleted"},
{stringId:"stat.breakItem.316",name:"Golden Leggings Depleted"},
{stringId:"stat.breakItem.317",name:"Golden Boots Depleted"},
{stringId:"stat.breakItem.318",name:"Flint Depleted"},
{stringId:"stat.breakItem.319",name:"Raw Porkchop Depleted"},
{stringId:"stat.breakItem.320",name:"Cooked Porkchop Depleted"},
{stringId:"stat.breakItem.321",name:"Painting Depleted"},
{stringId:"stat.breakItem.322",name:"Golden Apple Depleted"},
{stringId:"stat.breakItem.323",name:"Sign Depleted"},
{stringId:"stat.breakItem.324",name:"Wooden Door Depleted"},
{stringId:"stat.breakItem.325",name:"Bucket Depleted"},
{stringId:"stat.breakItem.326",name:"Water Bucket Depleted"},
{stringId:"stat.breakItem.327",name:"Lava Bucket Depleted"},
{stringId:"stat.breakItem.328",name:"Minecart Depleted"},
{stringId:"stat.breakItem.329",name:"Saddle Depleted"},
{stringId:"stat.breakItem.330",name:"Iron Door Depleted"},
{stringId:"stat.breakItem.331",name:"Redstone Depleted"},
{stringId:"stat.breakItem.332",name:"Snowball Depleted"},
{stringId:"stat.breakItem.333",name:"Boat Depleted"},
{stringId:"stat.breakItem.334",name:"Leather Depleted"},
{stringId:"stat.breakItem.335",name:"Milk Depleted"},
{stringId:"stat.breakItem.336",name:"Brick Depleted"},
{stringId:"stat.breakItem.337",name:"Clay Depleted"},
{stringId:"stat.breakItem.338",name:"Sugar Canes Depleted"},
{stringId:"stat.breakItem.339",name:"Paper Depleted"},
{stringId:"stat.breakItem.340",name:"Book Depleted"},
{stringId:"stat.breakItem.341",name:"Slimeball Depleted"},
{stringId:"stat.breakItem.342",name:"Minecart with Chest Depleted"},
{stringId:"stat.breakItem.343",name:"Minecart with Furnace Depleted"},
{stringId:"stat.breakItem.344",name:"Egg Depleted"},
{stringId:"stat.breakItem.345",name:"Compass Depleted"},
{stringId:"stat.breakItem.346",name:"Fishing Rod Depleted"},
{stringId:"stat.breakItem.347",name:"Clock Depleted"},
{stringId:"stat.breakItem.348",name:"Glowstone Dust Depleted"},
{stringId:"stat.breakItem.349",name:"Raw Fish Depleted"},
{stringId:"stat.breakItem.350",name:"Cooked Fish Depleted"},
{stringId:"stat.breakItem.351",name:"item.dyePowder.name Depleted"},
{stringId:"stat.breakItem.352",name:"Bone Depleted"},
{stringId:"stat.breakItem.353",name:"Sugar Depleted"},
{stringId:"stat.breakItem.354",name:"Cake Depleted"},
{stringId:"stat.breakItem.355",name:"Bed Depleted"},
{stringId:"stat.breakItem.356",name:"Redstone Repeater Depleted"},
{stringId:"stat.breakItem.357",name:"Cookie Depleted"},
{stringId:"stat.breakItem.358",name:"Map Depleted"},
{stringId:"stat.breakItem.359",name:"Shears Depleted"},
{stringId:"stat.breakItem.360",name:"Melon Depleted"},
{stringId:"stat.breakItem.361",name:"Pumpkin Seeds Depleted"},
{stringId:"stat.breakItem.362",name:"Melon Seeds Depleted"},
{stringId:"stat.breakItem.363",name:"Raw Beef Depleted"},
{stringId:"stat.breakItem.364",name:"Steak Depleted"},
{stringId:"stat.breakItem.365",name:"Raw Chicken Depleted"},
{stringId:"stat.breakItem.366",name:"Cooked Chicken Depleted"},
{stringId:"stat.breakItem.367",name:"Rotten Flesh Depleted"},
{stringId:"stat.breakItem.368",name:"Ender Pearl Depleted"},
{stringId:"stat.breakItem.369",name:"Blaze Rod Depleted"},
{stringId:"stat.breakItem.370",name:"Ghast Tear Depleted"},
{stringId:"stat.breakItem.371",name:"Gold Nugget Depleted"},
{stringId:"stat.breakItem.372",name:"Nether Wart Depleted"},
{stringId:"stat.breakItem.373",name:"Potion Depleted"},
{stringId:"stat.breakItem.374",name:"Glass Bottle Depleted"},
{stringId:"stat.breakItem.375",name:"Spider Eye Depleted"},
{stringId:"stat.breakItem.376",name:"Fermented Spider Eye Depleted"},
{stringId:"stat.breakItem.377",name:"Blaze Powder Depleted"},
{stringId:"stat.breakItem.378",name:"Magma Cream Depleted"},
{stringId:"stat.breakItem.379",name:"Brewing Stand Depleted"},
{stringId:"stat.breakItem.380",name:"Cauldron Depleted"},
{stringId:"stat.breakItem.381",name:"Eye of Ender Depleted"},
{stringId:"stat.breakItem.382",name:"Glistering Melon Depleted"},
{stringId:"stat.breakItem.383",name:"Spawn Depleted"},
{stringId:"stat.breakItem.384",name:"Bottle o' Enchanting Depleted"},
{stringId:"stat.breakItem.385",name:"Fire Charge Depleted"},
{stringId:"stat.breakItem.386",name:"Book and Quill Depleted"},
{stringId:"stat.breakItem.387",name:"Written Book Depleted"},
{stringId:"stat.breakItem.388",name:"Emerald Depleted"},
{stringId:"stat.breakItem.389",name:"Item Frame Depleted"},
{stringId:"stat.breakItem.390",name:"Flower Pot Depleted"},
{stringId:"stat.breakItem.391",name:"Carrot Depleted"},
{stringId:"stat.breakItem.392",name:"Potato Depleted"},
{stringId:"stat.breakItem.393",name:"Baked Potato Depleted"},
{stringId:"stat.breakItem.394",name:"Poisonous Potato Depleted"},
{stringId:"stat.breakItem.395",name:"Empty Map Depleted"},
{stringId:"stat.breakItem.396",name:"Golden Carrot Depleted"},
{stringId:"stat.breakItem.397",name:"item.skull.name Depleted"},
{stringId:"stat.breakItem.398",name:"Carrot on a Stick Depleted"},
{stringId:"stat.breakItem.399",name:"Nether Star Depleted"},
{stringId:"stat.breakItem.400",name:"Pumpkin Pie Depleted"},
{stringId:"stat.breakItem.401",name:"Firework Rocket Depleted"},
{stringId:"stat.breakItem.402",name:"Firework Star Depleted"},
{stringId:"stat.breakItem.403",name:"Enchanted Book Depleted"},
{stringId:"stat.breakItem.404",name:"Redstone Comparator Depleted"},
{stringId:"stat.breakItem.405",name:"Nether Brick Depleted"},
{stringId:"stat.breakItem.406",name:"Nether Quartz Depleted"},
{stringId:"stat.breakItem.407",name:"Minecart with TNT Depleted"},
{stringId:"stat.breakItem.408",name:"Minecart with Hopper Depleted"},
{stringId:"stat.breakItem.417",name:"Iron Horse Armor Depleted"},
{stringId:"stat.breakItem.418",name:"Gold Horse Armor Depleted"},
{stringId:"stat.breakItem.419",name:"Diamond Horse Armor Depleted"},
{stringId:"stat.breakItem.420",name:"Lead Depleted"},
{stringId:"stat.breakItem.421",name:"Name Tag Depleted"},
{stringId:"stat.breakItem.2256",name:"Music Disc Depleted"},
{stringId:"stat.breakItem.2257",name:"Music Disc Depleted"},
{stringId:"stat.breakItem.2258",name:"Music Disc Depleted"},
{stringId:"stat.breakItem.2259",name:"Music Disc Depleted"},
{stringId:"stat.breakItem.2260",name:"Music Disc Depleted"},
{stringId:"stat.breakItem.2261",name:"Music Disc Depleted"},
{stringId:"stat.breakItem.2262",name:"Music Disc Depleted"},
{stringId:"stat.breakItem.2263",name:"Music Disc Depleted"},
{stringId:"stat.breakItem.2264",name:"Music Disc Depleted"},
{stringId:"stat.breakItem.2265",name:"Music Disc Depleted"},
{stringId:"stat.breakItem.2266",name:"Music Disc Depleted"},
{stringId:"stat.breakItem.2267",name:"Music Disc Depleted"},
{stringId:"stat.craftItem.275",name:"Stone Axe Crafted"},
{stringId:"stat.craftItem.1",name:"Stone Crafted"},
{stringId:"stat.craftItem.274",name:"Stone Pickaxe Crafted"},
{stringId:"stat.craftItem.273",name:"Stone Shovel Crafted"},
{stringId:"stat.craftItem.272",name:"Stone Sword Crafted"},
{stringId:"stat.craftItem.279",name:"Diamond Axe Crafted"},
{stringId:"stat.craftItem.278",name:"Diamond Pickaxe Crafted"},
{stringId:"stat.craftItem.5",name:"Wooden Planks Crafted"},
{stringId:"stat.craftItem.277",name:"Diamond Shovel Crafted"},
{stringId:"stat.craftItem.276",name:"Diamond Sword Crafted"},
{stringId:"stat.craftItem.283",name:"Golden Sword Crafted"},
{stringId:"stat.craftItem.282",name:"Mushroom Stew Crafted"},
{stringId:"stat.craftItem.281",name:"Bowl Crafted"},
{stringId:"stat.craftItem.280",name:"Stick Crafted"},
{stringId:"stat.craftItem.286",name:"Golden Axe Crafted"},
{stringId:"stat.craftItem.285",name:"Golden Pickaxe Crafted"},
{stringId:"stat.craftItem.284",name:"Golden Shovel Crafted"},
{stringId:"stat.craftItem.258",name:"Iron Axe Crafted"},
{stringId:"stat.craftItem.259",name:"Flint and Steel Crafted"},
{stringId:"stat.craftItem.256",name:"Iron Shovel Crafted"},
{stringId:"stat.craftItem.257",name:"Iron Pickaxe Crafted"},
{stringId:"stat.craftItem.262",name:"Arrow Crafted"},
{stringId:"stat.craftItem.20",name:"Glass Crafted"},
{stringId:"stat.craftItem.263",name:"Coal Crafted"},
{stringId:"stat.craftItem.23",name:"Dispenser Crafted"},
{stringId:"stat.craftItem.261",name:"Bow Crafted"},
{stringId:"stat.craftItem.22",name:"Lapis Lazuli Block Crafted"},
{stringId:"stat.craftItem.25",name:"Note Block Crafted"},
{stringId:"stat.craftItem.266",name:"Gold Ingot Crafted"},
{stringId:"stat.craftItem.267",name:"Iron Sword Crafted"},
{stringId:"stat.craftItem.24",name:"Sandstone Crafted"},
{stringId:"stat.craftItem.27",name:"Powered Rail Crafted"},
{stringId:"stat.craftItem.264",name:"Diamond Crafted"},
{stringId:"stat.craftItem.265",name:"Iron Ingot Crafted"},
{stringId:"stat.craftItem.270",name:"Wooden Pickaxe Crafted"},
{stringId:"stat.craftItem.29",name:"Sticky Piston Crafted"},
{stringId:"stat.craftItem.271",name:"Wooden Axe Crafted"},
{stringId:"stat.craftItem.28",name:"Detector Rail Crafted"},
{stringId:"stat.craftItem.268",name:"Wooden Sword Crafted"},
{stringId:"stat.craftItem.269",name:"Wooden Shovel Crafted"},
{stringId:"stat.craftItem.305",name:"Chain Boots Crafted"},
{stringId:"stat.craftItem.304",name:"Chain Leggings Crafted"},
{stringId:"stat.craftItem.35",name:"Wool Crafted"},
{stringId:"stat.craftItem.307",name:"Iron Chestplate Crafted"},
{stringId:"stat.craftItem.33",name:"Piston Crafted"},
{stringId:"stat.craftItem.306",name:"Iron Helmet Crafted"},
{stringId:"stat.craftItem.309",name:"Iron Boots Crafted"},
{stringId:"stat.craftItem.308",name:"Iron Leggings Crafted"},
{stringId:"stat.craftItem.311",name:"Diamond Chestplate Crafted"},
{stringId:"stat.craftItem.310",name:"Diamond Helmet Crafted"},
{stringId:"stat.craftItem.42",name:"Block of Iron Crafted"},
{stringId:"stat.craftItem.313",name:"Diamond Boots Crafted"},
{stringId:"stat.craftItem.312",name:"Diamond Leggings Crafted"},
{stringId:"stat.craftItem.315",name:"Golden Chestplate Crafted"},
{stringId:"stat.craftItem.41",name:"Block of Gold Crafted"},
{stringId:"stat.craftItem.314",name:"Golden Helmet Crafted"},
{stringId:"stat.craftItem.46",name:"TNT Crafted"},
{stringId:"stat.craftItem.317",name:"Golden Boots Crafted"},
{stringId:"stat.craftItem.47",name:"Bookshelf Crafted"},
{stringId:"stat.craftItem.316",name:"Golden Leggings Crafted"},
{stringId:"stat.craftItem.44",name:"tile.stoneSlab.name Crafted"},
{stringId:"stat.craftItem.45",name:"Bricks Crafted"},
{stringId:"stat.craftItem.50",name:"Torch Crafted"},
{stringId:"stat.craftItem.290",name:"Wooden Hoe Crafted"},
{stringId:"stat.craftItem.291",name:"Stone Hoe Crafted"},
{stringId:"stat.craftItem.292",name:"Iron Hoe Crafted"},
{stringId:"stat.craftItem.293",name:"Diamond Hoe Crafted"},
{stringId:"stat.craftItem.54",name:"Chest Crafted"},
{stringId:"stat.craftItem.294",name:"Golden Hoe Crafted"},
{stringId:"stat.craftItem.53",name:"Oak Wood Stairs Crafted"},
{stringId:"stat.craftItem.296",name:"Wheat Crafted"},
{stringId:"stat.craftItem.58",name:"Crafting Table Crafted"},
{stringId:"stat.craftItem.297",name:"Bread Crafted"},
{stringId:"stat.craftItem.57",name:"Block of Diamond Crafted"},
{stringId:"stat.craftItem.298",name:"Leather Cap Crafted"},
{stringId:"stat.craftItem.299",name:"Leather Tunic Crafted"},
{stringId:"stat.craftItem.300",name:"Leather Pants Crafted"},
{stringId:"stat.craftItem.301",name:"Leather Boots Crafted"},
{stringId:"stat.craftItem.61",name:"Furnace Crafted"},
{stringId:"stat.craftItem.302",name:"Chain Helmet Crafted"},
{stringId:"stat.craftItem.303",name:"Chain Chestplate Crafted"},
{stringId:"stat.craftItem.343",name:"Minecart with Furnace Crafted"},
{stringId:"stat.craftItem.69",name:"Lever Crafted"},
{stringId:"stat.craftItem.342",name:"Minecart with Chest Crafted"},
{stringId:"stat.craftItem.70",name:"Pressure Plate Crafted"},
{stringId:"stat.craftItem.340",name:"Book Crafted"},
{stringId:"stat.craftItem.339",name:"Paper Crafted"},
{stringId:"stat.craftItem.65",name:"Ladder Crafted"},
{stringId:"stat.craftItem.66",name:"Rail Crafted"},
{stringId:"stat.craftItem.336",name:"Brick Crafted"},
{stringId:"stat.craftItem.67",name:"Stone Stairs Crafted"},
{stringId:"stat.craftItem.76",name:"Redstone Torch Crafted"},
{stringId:"stat.craftItem.351",name:"item.dyePowder.name Crafted"},
{stringId:"stat.craftItem.350",name:"Cooked Fish Crafted"},
{stringId:"stat.craftItem.77",name:"Button Crafted"},
{stringId:"stat.craftItem.78",name:"Snow Crafted"},
{stringId:"stat.craftItem.72",name:"Pressure Plate Crafted"},
{stringId:"stat.craftItem.347",name:"Clock Crafted"},
{stringId:"stat.craftItem.346",name:"Fishing Rod Crafted"},
{stringId:"stat.craftItem.345",name:"Compass Crafted"},
{stringId:"stat.craftItem.85",name:"Fence Crafted"},
{stringId:"stat.craftItem.84",name:"Jukebox Crafted"},
{stringId:"stat.craftItem.324",name:"Wooden Door Crafted"},
{stringId:"stat.craftItem.325",name:"Bucket Crafted"},
{stringId:"stat.craftItem.322",name:"Golden Apple Crafted"},
{stringId:"stat.craftItem.323",name:"Sign Crafted"},
{stringId:"stat.craftItem.80",name:"Snow Crafted"},
{stringId:"stat.craftItem.320",name:"Cooked Porkchop Crafted"},
{stringId:"stat.craftItem.321",name:"Painting Crafted"},
{stringId:"stat.craftItem.82",name:"Clay Crafted"},
{stringId:"stat.craftItem.333",name:"Boat Crafted"},
{stringId:"stat.craftItem.330",name:"Iron Door Crafted"},
{stringId:"stat.craftItem.89",name:"Glowstone Crafted"},
{stringId:"stat.craftItem.331",name:"Redstone Crafted"},
{stringId:"stat.craftItem.328",name:"Minecart Crafted"},
{stringId:"stat.craftItem.91",name:"Jack o'Lantern Crafted"},
{stringId:"stat.craftItem.102",name:"Glass Pane Crafted"},
{stringId:"stat.craftItem.103",name:"Melon Crafted"},
{stringId:"stat.craftItem.101",name:"Iron Bars Crafted"},
{stringId:"stat.craftItem.374",name:"Glass Bottle Crafted"},
{stringId:"stat.craftItem.98",name:"Stone Bricks Crafted"},
{stringId:"stat.craftItem.96",name:"Trapdoor Crafted"},
{stringId:"stat.craftItem.371",name:"Gold Nugget Crafted"},
{stringId:"stat.craftItem.381",name:"Eye of Ender Crafted"},
{stringId:"stat.craftItem.380",name:"Cauldron Crafted"},
{stringId:"stat.craftItem.108",name:"Brick Stairs Crafted"},
{stringId:"stat.craftItem.382",name:"Glistering Melon Crafted"},
{stringId:"stat.craftItem.109",name:"Stone Brick Stairs Crafted"},
{stringId:"stat.craftItem.377",name:"Blaze Powder Crafted"},
{stringId:"stat.craftItem.107",name:"Fence Gate Crafted"},
{stringId:"stat.craftItem.376",name:"Fermented Spider Eye Crafted"},
{stringId:"stat.craftItem.379",name:"Brewing Stand Crafted"},
{stringId:"stat.craftItem.378",name:"Magma Cream Crafted"},
{stringId:"stat.craftItem.356",name:"Redstone Repeater Crafted"},
{stringId:"stat.craftItem.357",name:"Cookie Crafted"},
{stringId:"stat.craftItem.116",name:"Enchantment Table Crafted"},
{stringId:"stat.craftItem.359",name:"Shears Crafted"},
{stringId:"stat.craftItem.353",name:"Sugar Crafted"},
{stringId:"stat.craftItem.114",name:"Nether Brick Stairs Crafted"},
{stringId:"stat.craftItem.354",name:"Cake Crafted"},
{stringId:"stat.craftItem.113",name:"Nether Brick Fence Crafted"},
{stringId:"stat.craftItem.355",name:"Bed Crafted"},
{stringId:"stat.craftItem.112",name:"Nether Brick Crafted"},
{stringId:"stat.craftItem.364",name:"Steak Crafted"},
{stringId:"stat.craftItem.126",name:"tile.woodSlab.name Crafted"},
{stringId:"stat.craftItem.366",name:"Cooked Chicken Crafted"},
{stringId:"stat.craftItem.123",name:"Redstone Lamp Crafted"},
{stringId:"stat.craftItem.361",name:"Pumpkin Seeds Crafted"},
{stringId:"stat.craftItem.362",name:"Melon Seeds Crafted"},
{stringId:"stat.craftItem.136",name:"Jungle Wood Stairs Crafted"},
{stringId:"stat.craftItem.408",name:"Minecart with Hopper Crafted"},
{stringId:"stat.craftItem.139",name:"tile.cobbleWall.name Crafted"},
{stringId:"stat.craftItem.138",name:"Beacon Crafted"},
{stringId:"stat.craftItem.143",name:"Button Crafted"},
{stringId:"stat.craftItem.128",name:"Sandstone Stairs Crafted"},
{stringId:"stat.craftItem.131",name:"Tripwire Hook Crafted"},
{stringId:"stat.craftItem.400",name:"Pumpkin Pie Crafted"},
{stringId:"stat.craftItem.130",name:"Ender Chest Crafted"},
{stringId:"stat.craftItem.406",name:"Nether Quartz Crafted"},
{stringId:"stat.craftItem.133",name:"Block of Emerald Crafted"},
{stringId:"stat.craftItem.407",name:"Minecart with TNT Crafted"},
{stringId:"stat.craftItem.404",name:"Redstone Comparator Crafted"},
{stringId:"stat.craftItem.135",name:"Birch Wood Stairs Crafted"},
{stringId:"stat.craftItem.405",name:"Nether Brick Crafted"},
{stringId:"stat.craftItem.134",name:"Spruce Wood Stairs Crafted"},
{stringId:"stat.craftItem.395",name:"Empty Map Crafted"},
{stringId:"stat.craftItem.152",name:"Block of Redstone Crafted"},
{stringId:"stat.craftItem.393",name:"Baked Potato Crafted"},
{stringId:"stat.craftItem.154",name:"Hopper Crafted"},
{stringId:"stat.craftItem.155",name:"tile.quartzBlock.name Crafted"},
{stringId:"stat.craftItem.156",name:"Quartz Stairs Crafted"},
{stringId:"stat.craftItem.157",name:"Activator Rail Crafted"},
{stringId:"stat.craftItem.398",name:"Carrot on a Stick Crafted"},
{stringId:"stat.craftItem.158",name:"Dropper Crafted"},
{stringId:"stat.craftItem.159",name:"tile.clayHardenedStained.name Crafted"},
{stringId:"stat.craftItem.396",name:"Golden Carrot Crafted"},
{stringId:"stat.craftItem.386",name:"Book and Quill Crafted"},
{stringId:"stat.craftItem.145",name:"Anvil Crafted"},
{stringId:"stat.craftItem.385",name:"Fire Charge Crafted"},
{stringId:"stat.craftItem.146",name:"Trapped Chest Crafted"},
{stringId:"stat.craftItem.147",name:"Weighted Pressure Plate (Light) Crafted"},
{stringId:"stat.craftItem.148",name:"Weighted Pressure Plate (Heavy) Crafted"},
{stringId:"stat.craftItem.390",name:"Flower Pot Crafted"},
{stringId:"stat.craftItem.389",name:"Item Frame Crafted"},
{stringId:"stat.craftItem.388",name:"Emerald Crafted"},
{stringId:"stat.craftItem.151",name:"Daylight Sensor Crafted"},
{stringId:"stat.craftItem.171",name:"tile.woolCarpet.name Crafted"},
{stringId:"stat.craftItem.170",name:"Hay Bale Crafted"},
{stringId:"stat.craftItem.173",name:"Block of Coal Crafted"},
{stringId:"stat.craftItem.172",name:"Hardened Clay Crafted"},
{stringId:"stat.craftItem.420",name:"Lead Crafted"}
];
/**ENCHANTMENTS**/
enchantments = [
{id:0,name:"Protection",minLevel:1,maxLevel:4},
{id:1,name:"Fire Protection",minLevel:1,maxLevel:4},
{id:2,name:"Feather Falling",minLevel:1,maxLevel:4},
{id:3,name:"Blast Protection",minLevel:1,maxLevel:4},
{id:4,name:"Projectile Protection",minLevel:1,maxLevel:4},
{id:5,name:"Respiration",minLevel:1,maxLevel:3},
{id:6,name:"Aqua Affinity",minLevel:1,maxLevel:1},
{id:7,name:"Thorns",minLevel:1,maxLevel:3},
{id:16,name:"Sharpness",minLevel:1,maxLevel:5},
{id:17,name:"Smite",minLevel:1,maxLevel:5},
{id:18,name:"Bane of Arthropods",minLevel:1,maxLevel:5},
{id:19,name:"Knockback",minLevel:1,maxLevel:2},
{id:20,name:"Fire Aspect",minLevel:1,maxLevel:2},
{id:21,name:"Looting",minLevel:1,maxLevel:3},
{id:32,name:"Efficiency",minLevel:1,maxLevel:5},
{id:33,name:"Silk Touch",minLevel:1,maxLevel:1},
{id:34,name:"Unbreaking",minLevel:1,maxLevel:3},
{id:35,name:"Fortune",minLevel:1,maxLevel:3},
{id:48,name:"Power",minLevel:1,maxLevel:5},
{id:49,name:"Punch",minLevel:1,maxLevel:2},
{id:50,name:"Flame",minLevel:1,maxLevel:1},
{id:51,name:"Infinity",minLevel:1,maxLevel:1}
];
/**POTIONS**/
potions = [
{id:1,name:"Speed"},
{id:2,name:"Slowness"},
{id:3,name:"Haste"},
{id:4,name:"Mining Fatigue"},
{id:5,name:"Strength"},
{id:6,name:"Instant Health"},
{id:7,name:"Instant Damage"},
{id:8,name:"Jump Boost"},
{id:9,name:"Nausea"},
{id:10,name:"Regeneration"},
{id:11,name:"Resistance"},
{id:12,name:"Fire Resistance"},
{id:13,name:"Water Breathing"},
{id:14,name:"Invisibility"},
{id:15,name:"Blindness"},
{id:16,name:"Night Vision"},
{id:17,name:"Hunger"},
{id:18,name:"Weakness"},
{id:19,name:"Poison"},
{id:20,name:"Wither"},
{id:21,name:"Health Boost"},
{id:22,name:"Absorption"},
{id:23,name:"Saturation"}
];
/**COLORS**/
colors = [
{stringId:"black",name:"Black"},
{stringId:"dark_blue",name:"Dark blue"},
{stringId:"dark_green",name:"Dark green"},
{stringId:"dark_aqua",name:"Dark aqua"},
{stringId:"dark_red",name:"Dark red"},
{stringId:"dark_purple",name:"Dark purple"},
{stringId:"gold",name:"Gold"},
{stringId:"gray",name:"Gray"},
{stringId:"dark_gray",name:"Dark gray"},
{stringId:"blue",name:"Blue"},
{stringId:"green",name:"Green"},
{stringId:"aqua",name:"Aqua"},
{stringId:"red",name:"Red"},
{stringId:"light_purple",name:"Light purple"},
{stringId:"yellow",name:"Yellow"},
{stringId:"white",name:"White"},
{stringId:"reset",name:"Reset"}
];

//**INFO FROM MC ENDS HERE**//

/**ENTITIES**/
entities = [
	{ group: 'Passive Mobs' },
	{
		id: 'Bat',
		name: 'Bat',
		structure: 'EntityMobBat'
	},
	{
		id: 'Chicken',
		name: 'Chicken',
		structure: 'EntityMobBreedable'
	},
	{
		id: 'Cow',
		name: 'Cow',
		structure: 'EntityMobBreedable'
	},
	{
		id: 'EntityHorse',
		name: 'Horse',
		structure: 'EntityMobHorse'
	},
	{
		id: 'MushroomCow',
		name: 'Mooshroom',
		structure: 'EntityMobBreedable'
	},
	{
		id: 'Ozelot',
		name: 'Ocelot',
		structure: 'EntityMobOzelot'
	},
	{
		id: 'Pig',
		name: 'Pig',
		structure: 'EntityMobPig'
	},
	{
		id: 'Sheep',
		name: 'Sheep',
		structure: 'EntityMobBreedable'
	},
	{
		id: 'Squid',
		name: 'Squid',
		structure: 'EntityMob'
	},
	{
		id: 'Villager',
		name: 'Villager',
		structure: 'EntityMobVillager'
	},
	{ group: 'Neutral Mobs' },
	{
		id: 'Enderman',
		name: 'Enderman',
		structure: 'EntityMobEnderman'
	},
	{
		id: 'Wolf',
		name: 'Wolf',
		structure: 'EntityMobWolf'
	},
	{ group: 'Aggressive Mobs' },
	{
		id: 'Blaze',
		name: 'Blaze',
		structure: 'EntityMob'
	},
	{
		id: 'CaveSpider',
		name: 'Cave Spider',
		structure: 'EntityMob'
	},
	{
		id: 'Creeper',
		name: 'Creeper',
		structure: 'EntityMobCreeper'
	},
	{
		id: 'Ghast',
		name: 'Ghast',
		structure: 'EntityMobGhast'
	},
	{
		id: 'Giant',
		name: 'Giant',
		structure: 'EntityMob'
	},
	{
		id: 'LavaSlime',
		name: 'Magma Cube',
		structure: 'EntityMobSlime'
	},
	{
		id: 'Silverfish',
		name: 'Silverfish',
		structure: 'EntityMob'
	},
	{
		id: 'Skeleton',
		name: 'Skeleton',
		structure: 'EntityMobSkeleton'
	},
	{
		id: 'Slime',
		name: 'Slime',
		structure: 'EntityMobSlime'
	},
	{
		id: 'Spider',
		name: 'Spider',
		structure: 'EntityMob'
	},
	{
		id: 'Witch',
		name: 'Witch',
		structure: 'EntityMob'
	},
	{
		id: 'Zombie',
		name: 'Zombie',
		structure: 'EntityMobZombie'
	},
	{
		id: 'PigZombie',
		name: 'Zombie Pigman',
		structure: 'EntityMobPigZombie'
	},
	{ group: 'Utility Mobs' },
	{
		id: 'VillagerGolem',
		name: 'Iron Golem',
		structure: 'EntityMobVillagerGolem'
	},
	{
		id: 'SnowMan',
		name: 'Snow Golem',
		structure: 'EntityMob'
	},
	{ group: 'Boss Mobs' },
	{
		id: 'EnderDragon',
		name: 'Ender Dragon',
		structure: 'EntityMob'
	},
	{
		id: 'WitherBoss',
		name: 'Wither',
		structure: 'EntityMobWitherBoss'
	},
	{ group: 'Projectiles' },
	{
		id: 'Arrow',
		name: 'Arrow',
		structure: 'EntityProjectileArrow'
	},
	{
		id: 'ThrownEnderpearl',
		name: 'Enderpearl',
		structure: 'EntityProjectileOwned'
	},
	{
		id: 'Fireball',
		name: 'Fireball',
		structure: 'EntityProjectileFireball'
	},
	{
		id: 'ThrownPotion',
		name: 'Potion',
		structure: 'EntityProjectileThrownPotion'
	},
	{
		id: 'SmallFireball',
		name: 'Small Fireball',
		structure: 'EntityProjectileFireballs'
	},
	{
		id: 'Snowball',
		name: 'Snowball',
		structure: 'EntityProjectileOwned'
	},
	{
		id: 'WitherSkull',
		name: 'Wither Skull',
		structure: 'EntityProjectileFireballs'
	},
	{
		id: 'ThrownExpBottle',
		name: 'XP Bottle',
		structure: 'EntityProjectileOwned'
	},
	{ group: 'Minecarts' },
	{
		id: 'MinecartRideable',
		name: 'Minecart',
		structure: 'EntityMinecart'
	},
	{
		id: 'MinecartCommandBlock',
		name: 'Command Block Minecart',
		structure: 'EntityMinecartCommandBlock'
	},
	{
		id: 'MinecartHopper',
		name: 'Hopper Minecart',
		structure: 'EntityMinecartHopper'
	},
	{
		id: 'MinecartFurnace',
		name: 'Powered Minecart',
		structure: 'EntityMinecartFurnace'
	},
	{
		id: 'MinecartSpawner',
		name: 'Spawner Minecart',
		structure: 'EntityMinecartSpawner'
	},
	{
		id: 'MinecraftChest',
		name: 'Storage Minecart',
		structure: 'EntityMinecraftInventory'
	},
	{
		id: 'MinecartTNT',
		name: 'TNT Minecart',
		structure: 'EntityMinecartTNT'
	},
	{ group: 'Other' },
	{
		id: 'Boat',
		name: 'Boat',
		structure: 'Entity'
	},
	{
		id: 'EnderCrystal',
		name: 'Ender Crystal',
		structure: 'Entity'
	},
	{
		id: 'EyeOfEnderSignal',
		name: 'Eye Of Ender',
		structure: 'Entity'
	},
	{
		id: 'FallingSand',
		name: 'Falling Sand',
		structure: 'EntityFallingSand'
	},
	{
		id: 'FireworksRocketEntity',
		name: 'Firework',
		structure: 'EntityFirework'
	},
	{
		id: 'PrimedTnt',
		name: 'Primed TNT',
		structure: 'EntityPrimedTNT'
	},
	{
		id: 'Item',
		name: 'Item',
		structure: 'EntityItem'
	},
	{
		id: 'ItemFrame',
		name: 'Item Frame',
		structure: 'EntityItemFrame'
	},
	{
		id: 'LeashKnot',
		name: 'Leash Knot',
		structure: 'Entity'
	},
	{
		id: 'Painting',
		name: 'Painting',
		structure: 'EntityPainting'
	},
	{
		id: 'XPOrb',
		name: 'XP Orb',
		structure: 'EntityXPOrb'
	},
	/*
	{
		id: 'Mob',
		name: 'Mob',
		structure: 'EntityMob'
	},
	{
		id: 'Monster',
		name: 'Monster',
		structure: 'EntityMob'
	},*/
]

/**SOUNDS**/
sounds = [
	"ambient.cave.cave",
	"ambient.weather.rain",
	"ambient.weather.thunder",
	"damage.fallbig",
	"damage.fallsmall",
	"damage.hit",
	"dig.cloth",
	"dig.grass",
	"dig.gravel",
	"dig.sand",
	"dig.snow",
	"dig.stone",
	"dig.wood",
	"fire.fire",
	"fire.ignite",
	"fireworks.blast",
	"fireworks.blast_far",
	"fireworks.largeBlast",
	"fireworks.largeBlast_far",
	"fireworks.launch",
	"fireworks.twinkle",
	"fireworks.twinkle_far",
	"liquid.lava",
	"liquid.lavapop",
	"liquid.splash",
	"liquid.swim",
	"liquid.water",
	"minecart.base",
	"minecart.inside",
	"mob.bat.death",
	"mob.bat.hurt",
	"mob.bat.idle",
	"mob.bat.loop",
	"mob.bat.takeoff",
	"mob.blaze.breathe",
	"mob.blaze.death",
	"mob.blaze.hit",
	"mob.cat.hiss",
	"mob.cat.hitt",
	"mob.cat.meow",
	"mob.cat.purr",
	"mob.cat.purreow",
	"mob.chicken.hurt",
	"mob.chicken.plop",
	"mob.chicken.say",
	"mob.chicken.step",
	"mob.cow.hurt",
	"mob.cow.say",
	"mob.cow.step",
	"mob.creeper.death",
	"mob.creeper.say",
	"mob.enderdragon.end",
	"mob.enderdragon.growl",
	"mob.enderdragon.hit",
	"mob.enderdragon.wings",
	"mob.endermen.death",
	"mob.endermen.hit",
	"mob.endermen.idle",
	"mob.endermen.portal",
	"mob.endermen.scream",
	"mob.endermen.stare",
	"mob.ghast.affectionate_scream",
	"mob.ghast.charge",
	"mob.ghast.death",
	"mob.ghast.fireball",
	"mob.ghast.moan",
	"mob.ghast.scream",
	"mob.horse.angry",
	"mob.horse.armor",
	"mob.horse.breathe",
	"mob.horse.death",
	"mob.horse.donkey.angry",
	"mob.horse.donkey.death",
	"mob.horse.donkey.hit",
	"mob.horse.donkey.idle",
	"mob.horse.gallop",
	"mob.horse.hit",
	"mob.horse.idle",
	"mob.horse.jump",
	"mob.horse.land",
	"mob.horse.leather",
	"mob.horse.skeleton.death",
	"mob.horse.skeleton.hit",
	"mob.horse.skeleton.idle",
	"mob.horse.soft",
	"mob.horse.wood",
	"mob.horse.zombie.death",
	"mob.horse.zombie.hit",
	"mob.horse.zombie.idle",
	"mob.irongolem.death",
	"mob.irongolem.hit",
	"mob.irongolem.throw",
	"mob.irongolem.walk",
	"mob.magmacube.big",
	"mob.magmacube.jump",
	"mob.magmacube.small",
	"mob.pig.death",
	"mob.pig.say",
	"mob.pig.step",
	"mob.sheep.say",
	"mob.sheep.shear",
	"mob.sheep.step",
	"mob.silverfish.hit",
	"mob.silverfish.kill",
	"mob.silverfish.say",
	"mob.silverfish.step",
	"mob.skeleton.death",
	"mob.skeleton.hurt",
	"mob.skeleton.say",
	"mob.skeleton.step",
	"mob.slime.attack",
	"mob.slime.big",
	"mob.slime.small",
	"mob.spider.death",
	"mob.spider.say",
	"mob.spider.step",
	"mob.villager.death",
	"mob.villager.haggle",
	"mob.villager.hit",
	"mob.villager.idle",
	"mob.villager.no",
	"mob.villager.yes",
	"mob.wither.death",
	"mob.wither.hurt",
	"mob.wither.idle",
	"mob.wither.shoot",
	"mob.wither.spawn",
	"mob.wolf.bark",
	"mob.wolf.death",
	"mob.wolf.growl",
	"mob.wolf.howl",
	"mob.wolf.hurt",
	"mob.wolf.panting",
	"mob.wolf.shake",
	"mob.wolf.step",
	"mob.wolf.whine",
	"mob.zombie.death",
	"mob.zombie.hurt",
	"mob.zombie.infect",
	"mob.zombie.metal",
	"mob.zombie.remedy",
	"mob.zombie.say",
	"mob.zombie.step",
	"mob.zombie.unfect",
	"mob.zombie.wood",
	"mob.zombie.woodbreak",
	"mob.zombiepig.zpig",
	"mob.zombiepig.zpigangry",
	"mob.zombiepig.zpigdeath",
	"mob.zombiepig.zpighurt",
	"note.bass",
	"note.bassattack",
	"note.bd",
	"note.harp",
	"note.hat",
	"note.pling",
	"note.snare",
	"portal.portal",
	"portal.travel",
	"portal.trigger",
	"random.anvil_break",
	"random.anvil_land",
	"random.anvil_use",
	"random.bow",
	"random.bowhit",
	"random.break",
	"random.breath",
	"random.burp",
	"random.chestclosed",
	"random.chestopen",
	"random.classic_hurt",
	"random.click",
	"random.door_close",
	"random.door_open",
	"random.drink",
	"random.eat",
	"random.explode",
	"random.fizz",
	"random.fuse",
	"random.glass",
	"random.levelup",
	"random.orb",
	"random.pop",
	"random.splash",
	"random.successful_hit",
	"random.wood_click",
	"step.cloth",
	"step.grass",
	"step.gravel",
	"step.ladder",
	"step.sand",
	"step.snow",
	"step.stone",
	"step.wood",
	"tile.piston.in",
	"tile.piston.out"
]

/**TRANSLATABLES*/
translatables = [
	"achievement.acquireIron",
	"achievement.acquireIron.desc",
	"achievement.bakeCake",
	"achievement.bakeCake.desc",
	"achievement.blazeRod",
	"achievement.blazeRod.desc",
	"achievement.bookcase",
	"achievement.bookcase.desc",
	"achievement.buildBetterPickaxe",
	"achievement.buildBetterPickaxe.desc",
	"achievement.buildFurnace",
	"achievement.buildFurnace.desc",
	"achievement.buildHoe",
	"achievement.buildHoe.desc",
	"achievement.buildPickaxe",
	"achievement.buildPickaxe.desc",
	"achievement.buildSword",
	"achievement.buildSword.desc",
	"achievement.buildWorkBench",
	"achievement.buildWorkBench.desc",
	"achievement.cookFish",
	"achievement.cookFish.desc",
	"achievement.diamonds",
	"achievement.diamonds.desc",
	"achievement.enchantments",
	"achievement.enchantments.desc",
	"achievement.flyPig",
	"achievement.flyPig.desc",
	"achievement.get",
	"achievement.ghast",
	"achievement.ghast.desc",
	"achievement.killCow",
	"achievement.killCow.desc",
	"achievement.killEnemy",
	"achievement.killEnemy.desc",
	"achievement.makeBread",
	"achievement.makeBread.desc",
	"achievement.mineWood",
	"achievement.mineWood.desc",
	"achievement.onARail",
	"achievement.onARail.desc",
	"achievement.openInventory",
	"achievement.openInventory.desc",
	"achievement.overkill",
	"achievement.overkill.desc",
	"achievement.portal",
	"achievement.portal.desc",
	"achievement.potion",
	"achievement.potion.desc",
	"achievement.requires",
	"achievement.snipeSkeleton",
	"achievement.snipeSkeleton.desc",
	"achievement.taken",
	"achievement.theEnd",
	"achievement.theEnd.desc",
	"achievement.theEnd2",
	"achievement.theEnd2.desc",
	"addServer.add",
	"addServer.enterIp",
	"addServer.enterName",
	"addServer.hideAddress",
	"addServer.title",
	"advMode.allPlayers",
	"advMode.command",
	"advMode.nearestPlayer",
	"advMode.notAllowed",
	"advMode.notEnabled",
	"advMode.randomPlayer",
	"advMode.setCommand",
	"advMode.setCommand.success",
	"attribute.modifier.plus.0",
	"attribute.modifier.plus.1",
	"attribute.modifier.plus.2",
	"attribute.modifier.take.0",
	"attribute.modifier.take.1",
	"attribute.modifier.take.2",
	"attribute.name.generic.attackDamage",
	"attribute.name.generic.followRange",
	"attribute.name.generic.knockbackResistance",
	"attribute.name.generic.maxHealth",
	"attribute.name.generic.movementSpeed",
	"attribute.name.horse.jumpStrength",
	"attribute.name.zombie.spawnReinforcements",
	"book.byAuthor",
	"book.editTitle",
	"book.finalizeButton",
	"book.finalizeWarning",
	"book.pageIndicator",
	"book.signButton",
	"build.tooHigh",
	"chat.cannotSend",
	"chat.copy",
	"chat.link.confirm",
	"chat.link.warning",
	"chat.type.admin",
	"chat.type.announcement",
	"chat.type.emote",
	"chat.type.text",
	"commands.ban.success",
	"commands.ban.usage",
	"commands.banip.invalid",
	"commands.banip.success",
	"commands.banip.success.players",
	"commands.banip.usage",
	"commands.banlist.ips",
	"commands.banlist.players",
	"commands.banlist.usage",
	"commands.clear.failure",
	"commands.clear.success",
	"commands.clear.usage",
	"commands.debug.notStarted",
	"commands.debug.start",
	"commands.debug.stop",
	"commands.debug.usage",
	"commands.defaultgamemode.success",
	"commands.defaultgamemode.usage",
	"commands.deop.success",
	"commands.deop.usage",
	"commands.difficulty.success",
	"commands.difficulty.usage",
	"commands.downfall.success",
	"commands.downfall.usage",
	"commands.effect.failure.notActive",
	"commands.effect.failure.notActive.all",
	"commands.effect.notFound",
	"commands.effect.success",
	"commands.effect.success.removed",
	"commands.effect.success.removed.all",
	"commands.effect.usage",
	"commands.enchant.cantCombine",
	"commands.enchant.cantEnchant",
	"commands.enchant.noItem",
	"commands.enchant.notFound",
	"commands.enchant.success",
	"commands.enchant.usage",
	"commands.gamemode.success.other",
	"commands.gamemode.success.self",
	"commands.gamemode.usage",
	"commands.gamerule.norule",
	"commands.gamerule.success",
	"commands.gamerule.usage",
	"commands.generic.boolean.invalid",
	"commands.generic.double.tooBig",
	"commands.generic.double.tooSmall",
	"commands.generic.exception",
	"commands.generic.notFound",
	"commands.generic.num.invalid",
	"commands.generic.num.tooBig",
	"commands.generic.num.tooSmall",
	"commands.generic.permission",
	"commands.generic.player.notFound",
	"commands.generic.syntax",
	"commands.generic.usage",
	"commands.give.notFound",
	"commands.give.success",
	"commands.give.usage",
	"commands.help.footer",
	"commands.help.header",
	"commands.help.usage",
	"commands.kick.success",
	"commands.kick.success.reason",
	"commands.kick.usage",
	"commands.kill.success",
	"commands.kill.usage",
	"commands.me.usage",
	"commands.message.display.incoming",
	"commands.message.display.outgoing",
	"commands.message.sameTarget",
	"commands.message.usage",
	"commands.op.success",
	"commands.op.usage",
	"commands.players.list",
	"commands.players.usage",
	"commands.publish.failed",
	"commands.publish.started",
	"commands.publish.usage",
	"commands.save-off.alreadyOff",
	"commands.save-off.usage",
	"commands.save-on.alreadyOn",
	"commands.save-on.usage",
	"commands.save.disabled",
	"commands.save.enabled",
	"commands.save.failed",
	"commands.save.start",
	"commands.save.success",
	"commands.save.usage",
	"commands.say.usage",
	"commands.scoreboard.objectiveNotFound",
	"commands.scoreboard.objectiveReadOnly",
	"commands.scoreboard.objectives.add.alreadyExists",
	"commands.scoreboard.objectives.add.displayTooLong",
	"commands.scoreboard.objectives.add.success",
	"commands.scoreboard.objectives.add.tooLong",
	"commands.scoreboard.objectives.add.usage",
	"commands.scoreboard.objectives.add.wrongType",
	"commands.scoreboard.objectives.list.count",
	"commands.scoreboard.objectives.list.empty",
	"commands.scoreboard.objectives.list.entry",
	"commands.scoreboard.objectives.remove.success",
	"commands.scoreboard.objectives.remove.usage",
	"commands.scoreboard.objectives.setdisplay.invalidSlot",
	"commands.scoreboard.objectives.setdisplay.successCleared",
	"commands.scoreboard.objectives.setdisplay.successSet",
	"commands.scoreboard.objectives.setdisplay.usage",
	"commands.scoreboard.objectives.usage",
	"commands.scoreboard.players.add.usage",
	"commands.scoreboard.players.list.count",
	"commands.scoreboard.players.list.empty",
	"commands.scoreboard.players.list.player.count",
	"commands.scoreboard.players.list.player.empty",
	"commands.scoreboard.players.list.player.entry",
	"commands.scoreboard.players.remove.usage",
	"commands.scoreboard.players.reset.success",
	"commands.scoreboard.players.reset.usage",
	"commands.scoreboard.players.set.success",
	"commands.scoreboard.players.set.usage",
	"commands.scoreboard.players.usage",
	"commands.scoreboard.teamNotFound",
	"commands.scoreboard.teams.add.alreadyExists",
	"commands.scoreboard.teams.add.displayTooLong",
	"commands.scoreboard.teams.add.success",
	"commands.scoreboard.teams.add.tooLong",
	"commands.scoreboard.teams.add.usage",
	"commands.scoreboard.teams.empty.alreadyEmpty",
	"commands.scoreboard.teams.empty.success",
	"commands.scoreboard.teams.empty.usage",
	"commands.scoreboard.teams.join.failure",
	"commands.scoreboard.teams.join.success",
	"commands.scoreboard.teams.join.usage",
	"commands.scoreboard.teams.leave.failure",
	"commands.scoreboard.teams.leave.noTeam",
	"commands.scoreboard.teams.leave.success",
	"commands.scoreboard.teams.leave.usage",
	"commands.scoreboard.teams.list.count",
	"commands.scoreboard.teams.list.empty",
	"commands.scoreboard.teams.list.entry",
	"commands.scoreboard.teams.list.player.count",
	"commands.scoreboard.teams.list.player.empty",
	"commands.scoreboard.teams.list.player.entry",
	"commands.scoreboard.teams.list.usage",
	"commands.scoreboard.teams.option.noValue",
	"commands.scoreboard.teams.option.success",
	"commands.scoreboard.teams.option.usage",
	"commands.scoreboard.teams.remove.success",
	"commands.scoreboard.teams.remove.usage",
	"commands.scoreboard.teams.usage",
	"commands.scoreboard.usage",
	"commands.seed.success",
	"commands.seed.usage",
	"commands.spawnpoint.success",
	"commands.spawnpoint.usage",
	"commands.spreadplayers.failure.players",
	"commands.spreadplayers.failure.teams",
	"commands.spreadplayers.info.players",
	"commands.spreadplayers.info.teams",
	"commands.spreadplayers.spreading.players",
	"commands.spreadplayers.spreading.teams",
	"commands.spreadplayers.success.players",
	"commands.spreadplayers.success.teams",
	"commands.spreadplayers.usage",
	"commands.stop.start",
	"commands.stop.usage",
	"commands.testfor.failed",
	"commands.testfor.usage",
	"commands.time.added",
	"commands.time.set",
	"commands.time.usage",
	"commands.tp.notSameDimension",
	"commands.tp.success",
	"commands.tp.success.coordinates",
	"commands.tp.usage",
	"commands.unban.success",
	"commands.unban.usage",
	"commands.unbanip.invalid",
	"commands.unbanip.success",
	"commands.unbanip.usage",
	"commands.weather.clear",
	"commands.weather.rain",
	"commands.weather.thunder",
	"commands.weather.usage",
	"commands.whitelist.add.success",
	"commands.whitelist.add.usage",
	"commands.whitelist.disabled",
	"commands.whitelist.enabled",
	"commands.whitelist.list",
	"commands.whitelist.reloaded",
	"commands.whitelist.remove.success",
	"commands.whitelist.remove.usage",
	"commands.whitelist.usage",
	"commands.xp.failure.widthdrawXp",
	"commands.xp.success",
	"commands.xp.success.levels",
	"commands.xp.success.negative.levels",
	"commands.xp.usage",
	"connect.authorizing",
	"connect.connecting",
	"connect.failed",
	"container.brewing",
	"container.chest",
	"container.chestDouble",
	"container.crafting",
	"container.creative",
	"container.dispenser",
	"container.dropper",
	"container.enchant",
	"container.enderchest",
	"container.furnace",
	"container.hopper",
	"container.inventory",
	"container.minecart",
	"container.repair",
	"container.repair.cost",
	"container.repair.expensive",
	"controls.title",
	"createWorld.customize.flat.addLayer",
	"createWorld.customize.flat.editLayer",
	"createWorld.customize.flat.height",
	"createWorld.customize.flat.layer",
	"createWorld.customize.flat.layer.bottom",
	"createWorld.customize.flat.layer.top",
	"createWorld.customize.flat.removeLayer",
	"createWorld.customize.flat.tile",
	"createWorld.customize.flat.title",
	"createWorld.customize.presets",
	"createWorld.customize.presets.list",
	"createWorld.customize.presets.select",
	"createWorld.customize.presets.share",
	"createWorld.customize.presets.title",
	"death.attack.anvil",
	"death.attack.arrow",
	"death.attack.arrow.item",
	"death.attack.cactus",
	"death.attack.cactus.player",
	"death.attack.drown",
	"death.attack.drown.player",
	"death.attack.explosion",
	"death.attack.explosion.player",
	"death.attack.fall",
	"death.attack.fallingBlock",
	"death.attack.fireball",
	"death.attack.fireball.item",
	"death.attack.generic",
	"death.attack.inFire",
	"death.attack.inFire.player",
	"death.attack.inWall",
	"death.attack.indirectMagic",
	"death.attack.indirectMagic.item",
	"death.attack.lava",
	"death.attack.lava.player",
	"death.attack.magic",
	"death.attack.mob",
	"death.attack.onFire",
	"death.attack.onFire.player",
	"death.attack.outOfWorld",
	"death.attack.player",
	"death.attack.player.item",
	"death.attack.starve",
	"death.attack.thorns",
	"death.attack.thrown",
	"death.attack.thrown.item",
	"death.attack.wither",
	"death.fell.accident.generic",
	"death.fell.accident.ladder",
	"death.fell.accident.vines",
	"death.fell.accident.water",
	"death.fell.assist",
	"death.fell.assist.item",
	"death.fell.finish",
	"death.fell.finish.item",
	"death.fell.killer",
	"deathScreen.deleteWorld",
	"deathScreen.hardcoreInfo",
	"deathScreen.leaveServer",
	"deathScreen.respawn",
	"deathScreen.score",
	"deathScreen.title",
	"deathScreen.title.hardcore",
	"deathScreen.titleScreen",
	"demo.day.1",
	"demo.day.2",
	"demo.day.3",
	"demo.day.4",
	"demo.day.5",
	"demo.day.6",
	"demo.day.warning",
	"demo.demoExpired",
	"demo.help.buy",
	"demo.help.fullWrapped",
	"demo.help.inventory",
	"demo.help.jump",
	"demo.help.later",
	"demo.help.movement",
	"demo.help.movementMouse",
	"demo.help.movementShort",
	"demo.help.title",
	"demo.remainingTime",
	"demo.reminder",
	"disconnect.closed",
	"disconnect.disconnected",
	"disconnect.endOfStream",
	"disconnect.genericReason",
	"disconnect.kicked",
	"disconnect.loginFailed",
	"disconnect.loginFailedInfo",
	"disconnect.lost",
	"disconnect.overflow",
	"disconnect.quitting",
	"disconnect.spam",
	"disconnect.timeout",
	"enchantment.arrowDamage",
	"enchantment.arrowFire",
	"enchantment.arrowInfinite",
	"enchantment.arrowKnockback",
	"enchantment.damage.all",
	"enchantment.damage.arthropods",
	"enchantment.damage.undead",
	"enchantment.digging",
	"enchantment.durability",
	"enchantment.fire",
	"enchantment.knockback",
	"enchantment.level.1",
	"enchantment.level.10",
	"enchantment.level.2",
	"enchantment.level.3",
	"enchantment.level.4",
	"enchantment.level.5",
	"enchantment.level.6",
	"enchantment.level.7",
	"enchantment.level.8",
	"enchantment.level.9",
	"enchantment.lootBonus",
	"enchantment.lootBonusDigger",
	"enchantment.oxygen",
	"enchantment.protect.all",
	"enchantment.protect.explosion",
	"enchantment.protect.fall",
	"enchantment.protect.fire",
	"enchantment.protect.projectile",
	"enchantment.thorns",
	"enchantment.untouching",
	"enchantment.waterWorker",
	"entity.Arrow.name",
	"entity.Bat.name",
	"entity.Blaze.name",
	"entity.Boat.name",
	"entity.Cat.name",
	"entity.CaveSpider.name",
	"entity.Chicken.name",
	"entity.Cow.name",
	"entity.Creeper.name",
	"entity.EnderDragon.name",
	"entity.Enderman.name",
	"entity.EntityHorse.name",
	"entity.FallingSand.name",
	"entity.Fireball.name",
	"entity.Ghast.name",
	"entity.Giant.name",
	"entity.Item.name",
	"entity.LavaSlime.name",
	"entity.Minecart.name",
	"entity.Mob.name",
	"entity.Monster.name",
	"entity.MushroomCow.name",
	"entity.Ozelot.name",
	"entity.Painting.name",
	"entity.Pig.name",
	"entity.PigZombie.name",
	"entity.PrimedTnt.name",
	"entity.Sheep.name",
	"entity.Silverfish.name",
	"entity.Skeleton.name",
	"entity.Slime.name",
	"entity.SmallFireball.name",
	"entity.SnowMan.name",
	"entity.Snowball.name",
	"entity.Spider.name",
	"entity.Squid.name",
	"entity.Villager.name",
	"entity.VillagerGolem.name",
	"entity.Witch.name",
	"entity.WitherBoss.name",
	"entity.Wolf.name",
	"entity.XPOrb.name",
	"entity.Zombie.name",
	"entity.donkey.name",
	"entity.generic.name",
	"entity.horse.name",
	"entity.mule.name",
	"entity.skeletonhorse.name",
	"entity.zombiehorse.name",
	"gameMode.adventure",
	"gameMode.changed",
	"gameMode.creative",
	"gameMode.hardcore",
	"gameMode.survival",
	"generator.default",
	"generator.flat",
	"generator.largeBiomes",
	"gui.achievements",
	"gui.back",
	"gui.cancel",
	"gui.done",
	"gui.down",
	"gui.no",
	"gui.stats",
	"gui.toMenu",
	"gui.up",
	"gui.yes",
	"inventory.binSlot",
	"item.apple.name",
	"item.appleGold.name",
	"item.arrow.name",
	"item.bed.name",
	"item.beefCooked.name",
	"item.beefRaw.name",
	"item.blazePowder.name",
	"item.blazeRod.name",
	"item.boat.name",
	"item.bone.name",
	"item.book.name",
	"item.bootsChain.name",
	"item.bootsCloth.name",
	"item.bootsDiamond.name",
	"item.bootsGold.name",
	"item.bootsIron.name",
	"item.bow.name",
	"item.bowl.name",
	"item.bread.name",
	"item.brewingStand.name",
	"item.brick.name",
	"item.bucket.name",
	"item.bucketLava.name",
	"item.bucketWater.name",
	"item.cake.name",
	"item.carrotGolden.name",
	"item.carrotOnAStick.name",
	"item.carrots.name",
	"item.cauldron.name",
	"item.charcoal.name",
	"item.chestplateChain.name",
	"item.chestplateCloth.name",
	"item.chestplateDiamond.name",
	"item.chestplateGold.name",
	"item.chestplateIron.name",
	"item.chickenCooked.name",
	"item.chickenRaw.name",
	"item.clay.name",
	"item.clock.name",
	"item.coal.name",
	"item.comparator.name",
	"item.compass.name",
	"item.cookie.name",
	"item.diamond.name",
	"item.diode.name",
	"item.doorIron.name",
	"item.doorWood.name",
	"item.dyePowder.black.name",
	"item.dyePowder.blue.name",
	"item.dyePowder.brown.name",
	"item.dyePowder.cyan.name",
	"item.dyePowder.gray.name",
	"item.dyePowder.green.name",
	"item.dyePowder.lightBlue.name",
	"item.dyePowder.lime.name",
	"item.dyePowder.magenta.name",
	"item.dyePowder.orange.name",
	"item.dyePowder.pink.name",
	"item.dyePowder.purple.name",
	"item.dyePowder.red.name",
	"item.dyePowder.silver.name",
	"item.dyePowder.white.name",
	"item.dyePowder.yellow.name",
	"item.dyed",
	"item.egg.name",
	"item.emerald.name",
	"item.emptyMap.name",
	"item.emptyPotion.name",
	"item.enchantedBook.name",
	"item.enderPearl.name",
	"item.expBottle.name",
	"item.eyeOfEnder.name",
	"item.feather.name",
	"item.fermentedSpiderEye.name",
	"item.fireball.name",
	"item.fireworks.flight",
	"item.fireworks.name",
	"item.fireworksCharge.black",
	"item.fireworksCharge.blue",
	"item.fireworksCharge.brown",
	"item.fireworksCharge.customColor",
	"item.fireworksCharge.cyan",
	"item.fireworksCharge.fadeTo",
	"item.fireworksCharge.flicker",
	"item.fireworksCharge.gray",
	"item.fireworksCharge.green",
	"item.fireworksCharge.lightBlue",
	"item.fireworksCharge.lime",
	"item.fireworksCharge.magenta",
	"item.fireworksCharge.name",
	"item.fireworksCharge.orange",
	"item.fireworksCharge.pink",
	"item.fireworksCharge.purple",
	"item.fireworksCharge.red",
	"item.fireworksCharge.silver",
	"item.fireworksCharge.trail",
	"item.fireworksCharge.type",
	"item.fireworksCharge.type.0",
	"item.fireworksCharge.type.1",
	"item.fireworksCharge.type.2",
	"item.fireworksCharge.type.3",
	"item.fireworksCharge.type.4",
	"item.fireworksCharge.white",
	"item.fireworksCharge.yellow",
	"item.fishCooked.name",
	"item.fishRaw.name",
	"item.fishingRod.name",
	"item.flint.name",
	"item.flintAndSteel.name",
	"item.flowerPot.name",
	"item.frame.name",
	"item.ghastTear.name",
	"item.glassBottle.name",
	"item.goldNugget.name",
	"item.hatchetDiamond.name",
	"item.hatchetGold.name",
	"item.hatchetIron.name",
	"item.hatchetStone.name",
	"item.hatchetWood.name",
	"item.helmetChain.name",
	"item.helmetCloth.name",
	"item.helmetDiamond.name",
	"item.helmetGold.name",
	"item.helmetIron.name",
	"item.hoeDiamond.name",
	"item.hoeGold.name",
	"item.hoeIron.name",
	"item.hoeStone.name",
	"item.hoeWood.name",
	"item.horsearmordiamond.name",
	"item.horsearmorgold.name",
	"item.horsearmormetal.name",
	"item.ingotGold.name",
	"item.ingotIron.name",
	"item.leash.name",
	"item.leather.name",
	"item.leaves.name",
	"item.leggingsChain.name",
	"item.leggingsCloth.name",
	"item.leggingsDiamond.name",
	"item.leggingsGold.name",
	"item.leggingsIron.name",
	"item.magmaCream.name",
	"item.map.name",
	"item.melon.name",
	"item.milk.name",
	"item.minecart.name",
	"item.minecartChest.name",
	"item.minecartFurnace.name",
	"item.minecartHopper.name",
	"item.minecartTnt.name",
	"item.monsterPlacer.name",
	"item.mushroomStew.name",
	"item.nameTag.name",
	"item.netherStalkSeeds.name",
	"item.netherStar.name",
	"item.netherbrick.name",
	"item.netherquartz.name",
	"item.painting.name",
	"item.paper.name",
	"item.pickaxeDiamond.name",
	"item.pickaxeGold.name",
	"item.pickaxeIron.name",
	"item.pickaxeStone.name",
	"item.pickaxeWood.name",
	"item.porkchopCooked.name",
	"item.porkchopRaw.name",
	"item.potato.name",
	"item.potatoBaked.name",
	"item.potatoPoisonous.name",
	"item.potion.name",
	"item.pumpkinPie.name",
	"item.record.name",
	"item.redstone.name",
	"item.reeds.name",
	"item.rottenFlesh.name",
	"item.ruby.name",
	"item.saddle.name",
	"item.seeds.name",
	"item.seeds_melon.name",
	"item.seeds_pumpkin.name",
	"item.shears.name",
	"item.shovelDiamond.name",
	"item.shovelGold.name",
	"item.shovelIron.name",
	"item.shovelStone.name",
	"item.shovelWood.name",
	"item.sign.name",
	"item.skull.char.name",
	"item.skull.creeper.name",
	"item.skull.player.name",
	"item.skull.skeleton.name",
	"item.skull.wither.name",
	"item.skull.zombie.name",
	"item.slimeball.name",
	"item.snowball.name",
	"item.speckledMelon.name",
	"item.spiderEye.name",
	"item.stick.name",
	"item.string.name",
	"item.sugar.name",
	"item.sulphur.name",
	"item.swordDiamond.name",
	"item.swordGold.name",
	"item.swordIron.name",
	"item.swordStone.name",
	"item.swordWood.name",
	"item.wheat.name",
	"item.writingBook.name",
	"item.writtenBook.name",
	"item.yellowDust.name",
	"itemGroup.brewing",
	"itemGroup.buildingBlocks",
	"itemGroup.combat",
	"itemGroup.decorations",
	"itemGroup.food",
	"itemGroup.inventory",
	"itemGroup.materials",
	"itemGroup.misc",
	"itemGroup.redstone",
	"itemGroup.search",
	"itemGroup.tools",
	"itemGroup.transportation",
	"key.attack",
	"key.back",
	"key.chat",
	"key.command",
	"key.drop",
	"key.fog",
	"key.forward",
	"key.inventory",
	"key.jump",
	"key.left",
	"key.mouseButton",
	"key.pickItem",
	"key.playerlist",
	"key.right",
	"key.sneak",
	"key.use",
	"lanServer.otherPlayers",
	"lanServer.scanning",
	"lanServer.start",
	"lanServer.title",
	"language.code",
	"language.name",
	"language.region",
	"mco.backup.button.restore",
	"mco.backup.restoring",
	"mco.backup.title",
	"mco.configure.world.buttons.backup",
	"mco.configure.world.buttons.close",
	"mco.configure.world.buttons.delete",
	"mco.configure.world.buttons.done",
	"mco.configure.world.buttons.edit",
	"mco.configure.world.buttons.invite",
	"mco.configure.world.buttons.open",
	"mco.configure.world.buttons.reset",
	"mco.configure.world.buttons.subscription",
	"mco.configure.world.buttons.uninvite",
	"mco.configure.world.close.question.line1",
	"mco.configure.world.close.question.line2",
	"mco.configure.world.description",
	"mco.configure.world.edit.title",
	"mco.configure.world.invite.profile.name",
	"mco.configure.world.invited",
	"mco.configure.world.location",
	"mco.configure.world.name",
	"mco.configure.world.status",
	"mco.configure.world.subscription.daysleft",
	"mco.configure.world.subscription.extend",
	"mco.configure.world.subscription.start",
	"mco.configure.world.subscription.title",
	"mco.configure.world.title",
	"mco.configure.world.uninvite.question",
	"mco.connect.authorizing",
	"mco.connect.connecting",
	"mco.connect.failed",
	"mco.create.world",
	"mco.create.world.location.title",
	"mco.create.world.location.warning",
	"mco.create.world.seed",
	"mco.create.world.wait",
	"mco.invites.button.accept",
	"mco.invites.button.reject",
	"mco.invites.pending",
	"mco.invites.title",
	"mco.reset.world.resetting.screen.title",
	"mco.reset.world.seed",
	"mco.reset.world.title",
	"mco.reset.world.warning",
	"mco.selectServer.configure",
	"mco.selectServer.create",
	"mco.selectServer.moreinfo",
	"mco.selectServer.select",
	"mco.template.button.select",
	"mco.template.default.name",
	"mco.template.name",
	"mco.template.title",
	"mco.title",
	"mcoServer.title",
	"menu.convertingLevel",
	"menu.disconnect",
	"menu.generatingLevel",
	"menu.generatingTerrain",
	"menu.loadingLevel",
	"menu.multiplayer",
	"menu.online",
	"menu.options",
	"menu.playdemo",
	"menu.quit",
	"menu.resetdemo",
	"menu.respawning",
	"menu.returnToGame",
	"menu.returnToMenu",
	"menu.shareToLan",
	"menu.simulating",
	"menu.singleplayer",
	"menu.switchingLevel",
	"mount.onboard",
	"multiplayer.connect",
	"multiplayer.downloadingTerrain",
	"multiplayer.info1",
	"multiplayer.info2",
	"multiplayer.ipinfo",
	"multiplayer.player.joined",
	"multiplayer.player.left",
	"multiplayer.stopSleeping",
	"multiplayer.texturePrompt.line1",
	"multiplayer.texturePrompt.line2",
	"multiplayer.title",
	"options.advancedOpengl",
	"options.anaglyph",
	"options.ao",
	"options.ao.max",
	"options.ao.min",
	"options.ao.off",
	"options.chat.color",
	"options.chat.height.focused",
	"options.chat.height.unfocused",
	"options.chat.links",
	"options.chat.links.prompt",
	"options.chat.opacity",
	"options.chat.scale",
	"options.chat.title",
	"options.chat.visibility",
	"options.chat.visibility.full",
	"options.chat.visibility.hidden",
	"options.chat.visibility.system",
	"options.chat.width",
	"options.controls",
	"options.difficulty",
	"options.difficulty.easy",
	"options.difficulty.hard",
	"options.difficulty.hardcore",
	"options.difficulty.normal",
	"options.difficulty.peaceful",
	"options.farWarning1",
	"options.farWarning2",
	"options.fov",
	"options.fov.max",
	"options.fov.min",
	"options.framerateLimit",
	"options.fullscreen",
	"options.gamma",
	"options.gamma.max",
	"options.gamma.min",
	"options.graphics",
	"options.graphics.fancy",
	"options.graphics.fast",
	"options.guiScale",
	"options.guiScale.auto",
	"options.guiScale.large",
	"options.guiScale.normal",
	"options.guiScale.small",
	"options.hidden",
	"options.invertMouse",
	"options.language",
	"options.languageWarning",
	"options.multiplayer.title",
	"options.music",
	"options.off",
	"options.on",
	"options.particles",
	"options.particles.all",
	"options.particles.decreased",
	"options.particles.minimal",
	"options.renderClouds",
	"options.renderDistance",
	"options.renderDistance.far",
	"options.renderDistance.normal",
	"options.renderDistance.short",
	"options.renderDistance.tiny",
	"options.resourcepack",
	"options.sensitivity",
	"options.sensitivity.max",
	"options.sensitivity.min",
	"options.serverTextures",
	"options.showCape",
	"options.snooper",
	"options.snooper.desc",
	"options.snooper.title",
	"options.snooper.view",
	"options.sound",
	"options.title",
	"options.touchscreen",
	"options.video",
	"options.videoTitle",
	"options.viewBobbing",
	"options.visible",
	"options.vsync",
	"performance.balanced",
	"performance.max",
	"performance.powersaver",
	"potion.absorption",
	"potion.blindness",
	"potion.blindness.postfix",
	"potion.confusion",
	"potion.confusion.postfix",
	"potion.damageBoost",
	"potion.damageBoost.postfix",
	"potion.digSlowDown",
	"potion.digSlowDown.postfix",
	"potion.digSpeed",
	"potion.digSpeed.postfix",
	"potion.effects.whenDrank",
	"potion.empty",
	"potion.fireResistance",
	"potion.fireResistance.postfix",
	"potion.harm",
	"potion.harm.postfix",
	"potion.heal",
	"potion.heal.postfix",
	"potion.healthBoost",
	"potion.hunger",
	"potion.hunger.postfix",
	"potion.invisibility",
	"potion.invisibility.postfix",
	"potion.jump",
	"potion.jump.postfix",
	"potion.moveSlowdown",
	"potion.moveSlowdown.postfix",
	"potion.moveSpeed",
	"potion.moveSpeed.postfix",
	"potion.nightVision",
	"potion.nightVision.postfix",
	"potion.poison",
	"potion.poison.postfix",
	"potion.potency.0",
	"potion.potency.1",
	"potion.potency.2",
	"potion.potency.3",
	"potion.prefix.acrid",
	"potion.prefix.artless",
	"potion.prefix.awkward",
	"potion.prefix.bland",
	"potion.prefix.bulky",
	"potion.prefix.bungling",
	"potion.prefix.buttered",
	"potion.prefix.charming",
	"potion.prefix.clear",
	"potion.prefix.cordial",
	"potion.prefix.dashing",
	"potion.prefix.debonair",
	"potion.prefix.diffuse",
	"potion.prefix.elegant",
	"potion.prefix.fancy",
	"potion.prefix.flat",
	"potion.prefix.foul",
	"potion.prefix.grenade",
	"potion.prefix.gross",
	"potion.prefix.harsh",
	"potion.prefix.milky",
	"potion.prefix.mundane",
	"potion.prefix.odorless",
	"potion.prefix.potent",
	"potion.prefix.rank",
	"potion.prefix.refined",
	"potion.prefix.smooth",
	"potion.prefix.sparkling",
	"potion.prefix.stinky",
	"potion.prefix.suave",
	"potion.prefix.thick",
	"potion.prefix.thin",
	"potion.prefix.uninteresting",
	"potion.regeneration",
	"potion.regeneration.postfix",
	"potion.resistance",
	"potion.resistance.postfix",
	"potion.waterBreathing",
	"potion.waterBreathing.postfix",
	"potion.weakness",
	"potion.weakness.postfix",
	"potion.wither",
	"potion.wither.postfix",
	"resourcePack.folderInfo",
	"resourcePack.openFolder",
	"resourcePack.title",
	"selectServer.add",
	"selectServer.defaultName",
	"selectServer.delete",
	"selectServer.deleteButton",
	"selectServer.deleteQuestion",
	"selectServer.deleteWarning",
	"selectServer.direct",
	"selectServer.edit",
	"selectServer.empty",
	"selectServer.hiddenAddress",
	"selectServer.refresh",
	"selectServer.select",
	"selectServer.title",
	"selectWorld.allowCommands",
	"selectWorld.allowCommands.info",
	"selectWorld.bonusItems",
	"selectWorld.cheats",
	"selectWorld.conversion",
	"selectWorld.create",
	"selectWorld.createDemo",
	"selectWorld.customizeType",
	"selectWorld.delete",
	"selectWorld.deleteButton",
	"selectWorld.deleteQuestion",
	"selectWorld.deleteWarning",
	"selectWorld.empty",
	"selectWorld.enterName",
	"selectWorld.enterSeed",
	"selectWorld.gameMode",
	"selectWorld.gameMode.adventure",
	"selectWorld.gameMode.adventure.line1",
	"selectWorld.gameMode.adventure.line2",
	"selectWorld.gameMode.creative",
	"selectWorld.gameMode.creative.line1",
	"selectWorld.gameMode.creative.line2",
	"selectWorld.gameMode.hardcore",
	"selectWorld.gameMode.hardcore.line1",
	"selectWorld.gameMode.hardcore.line2",
	"selectWorld.gameMode.survival",
	"selectWorld.gameMode.survival.line1",
	"selectWorld.gameMode.survival.line2",
	"selectWorld.hardcoreMode",
	"selectWorld.hardcoreMode.info",
	"selectWorld.mapFeatures",
	"selectWorld.mapFeatures.info",
	"selectWorld.mapType",
	"selectWorld.mapType.normal",
	"selectWorld.moreWorldOptions",
	"selectWorld.newWorld",
	"selectWorld.newWorld.copyOf",
	"selectWorld.recreate",
	"selectWorld.rename",
	"selectWorld.renameButton",
	"selectWorld.renameTitle",
	"selectWorld.resultFolder",
	"selectWorld.seedInfo",
	"selectWorld.select",
	"selectWorld.title",
	"selectWorld.world",
	"stat.blocksButton",
	"stat.boatOneCm",
	"stat.breakItem",
	"stat.climbOneCm",
	"stat.craftItem",
	"stat.crafted",
	"stat.createWorld",
	"stat.damageDealt",
	"stat.damageTaken",
	"stat.deaths",
	"stat.depleted",
	"stat.diveOneCm",
	"stat.drop",
	"stat.fallOneCm",
	"stat.fishCaught",
	"stat.flyOneCm",
	"stat.generalButton",
	"stat.itemsButton",
	"stat.joinMultiplayer",
	"stat.jump",
	"stat.leaveGame",
	"stat.loadWorld",
	"stat.mineBlock",
	"stat.minecartOneCm",
	"stat.mined",
	"stat.mobKills",
	"stat.pigOneCm",
	"stat.playOneMinute",
	"stat.playerKills",
	"stat.startGame",
	"stat.swimOneCm",
	"stat.useItem",
	"stat.used",
	"stat.walkOneCm",
	"tile.activatorRail.name",
	"tile.anvil.intact.name",
	"tile.anvil.name",
	"tile.anvil.slightlyDamaged.name",
	"tile.anvil.veryDamaged.name",
	"tile.beacon.name",
	"tile.beacon.primary",
	"tile.beacon.secondary",
	"tile.bed.name",
	"tile.bed.noSleep",
	"tile.bed.notSafe",
	"tile.bed.notValid",
	"tile.bed.occupied",
	"tile.bedrock.name",
	"tile.blockCoal.name",
	"tile.blockDiamond.name",
	"tile.blockEmerald.name",
	"tile.blockGold.name",
	"tile.blockIron.name",
	"tile.blockLapis.name",
	"tile.blockRedstone.name",
	"tile.bookshelf.name",
	"tile.brick.name",
	"tile.button.name",
	"tile.cactus.name",
	"tile.cake.name",
	"tile.carrots.name",
	"tile.cauldron.name",
	"tile.chest.name",
	"tile.chestTrap.name",
	"tile.clay.name",
	"tile.clayHardened.name",
	"tile.clayHardenedStained.black.name",
	"tile.clayHardenedStained.blue.name",
	"tile.clayHardenedStained.brown.name",
	"tile.clayHardenedStained.cyan.name",
	"tile.clayHardenedStained.gray.name",
	"tile.clayHardenedStained.green.name",
	"tile.clayHardenedStained.lightBlue.name",
	"tile.clayHardenedStained.lime.name",
	"tile.clayHardenedStained.magenta.name",
	"tile.clayHardenedStained.orange.name",
	"tile.clayHardenedStained.pink.name",
	"tile.clayHardenedStained.purple.name",
	"tile.clayHardenedStained.red.name",
	"tile.clayHardenedStained.silver.name",
	"tile.clayHardenedStained.white.name",
	"tile.clayHardenedStained.yellow.name",
	"tile.cloth.black.name",
	"tile.cloth.blue.name",
	"tile.cloth.brown.name",
	"tile.cloth.cyan.name",
	"tile.cloth.gray.name",
	"tile.cloth.green.name",
	"tile.cloth.lightBlue.name",
	"tile.cloth.lime.name",
	"tile.cloth.magenta.name",
	"tile.cloth.name",
	"tile.cloth.orange.name",
	"tile.cloth.pink.name",
	"tile.cloth.purple.name",
	"tile.cloth.red.name",
	"tile.cloth.silver.name",
	"tile.cloth.white.name",
	"tile.cloth.yellow.name",
	"tile.cobbleWall.mossy.name",
	"tile.cobbleWall.normal.name",
	"tile.cocoa.name",
	"tile.commandBlock.name",
	"tile.crops.name",
	"tile.daylightDetector.name",
	"tile.deadbush.name",
	"tile.detectorRail.name",
	"tile.dirt.name",
	"tile.dispenser.name",
	"tile.doorIron.name",
	"tile.doorWood.name",
	"tile.dragonEgg.name",
	"tile.dropper.name",
	"tile.enchantmentTable.name",
	"tile.endPortalFrame.name",
	"tile.enderChest.name",
	"tile.farmland.name",
	"tile.fence.name",
	"tile.fenceGate.name",
	"tile.fenceIron.name",
	"tile.fire.name",
	"tile.flower.name",
	"tile.furnace.name",
	"tile.glass.name",
	"tile.goldenRail.name",
	"tile.grass.name",
	"tile.gravel.name",
	"tile.hayBlock.name",
	"tile.hellrock.name",
	"tile.hellsand.name",
	"tile.hopper.name",
	"tile.ice.name",
	"tile.jukebox.name",
	"tile.ladder.name",
	"tile.lava.name",
	"tile.leaves.birch.name",
	"tile.leaves.jungle.name",
	"tile.leaves.name",
	"tile.leaves.oak.name",
	"tile.leaves.spruce.name",
	"tile.lever.name",
	"tile.lightgem.name",
	"tile.litpumpkin.name",
	"tile.lockedchest.name",
	"tile.log.birch.name",
	"tile.log.jungle.name",
	"tile.log.name",
	"tile.log.oak.name",
	"tile.log.spruce.name",
	"tile.melon.name",
	"tile.mobSpawner.name",
	"tile.monsterStoneEgg.brick.name",
	"tile.monsterStoneEgg.cobble.name",
	"tile.monsterStoneEgg.stone.name",
	"tile.mushroom.name",
	"tile.musicBlock.name",
	"tile.mycel.name",
	"tile.netherBrick.name",
	"tile.netherFence.name",
	"tile.netherStalk.name",
	"tile.netherquartz.name",
	"tile.notGate.name",
	"tile.obsidian.name",
	"tile.oreCoal.name",
	"tile.oreDiamond.name",
	"tile.oreEmerald.name",
	"tile.oreGold.name",
	"tile.oreIron.name",
	"tile.oreLapis.name",
	"tile.oreRedstone.name",
	"tile.oreRuby.name",
	"tile.pistonBase.name",
	"tile.pistonStickyBase.name",
	"tile.portal.name",
	"tile.potatoes.name",
	"tile.pressurePlate.name",
	"tile.pumpkin.name",
	"tile.quartzBlock.chiseled.name",
	"tile.quartzBlock.default.name",
	"tile.quartzBlock.lines.name",
	"tile.rail.name",
	"tile.redstoneDust.name",
	"tile.redstoneLight.name",
	"tile.reeds.name",
	"tile.rose.name",
	"tile.sand.name",
	"tile.sandStone.chiseled.name",
	"tile.sandStone.default.name",
	"tile.sandStone.name",
	"tile.sandStone.smooth.name",
	"tile.sapling.birch.name",
	"tile.sapling.jungle.name",
	"tile.sapling.oak.name",
	"tile.sapling.spruce.name",
	"tile.sign.name",
	"tile.snow.name",
	"tile.sponge.name",
	"tile.stairsBrick.name",
	"tile.stairsNetherBrick.name",
	"tile.stairsQuartz.name",
	"tile.stairsSandStone.name",
	"tile.stairsStone.name",
	"tile.stairsStoneBrickSmooth.name",
	"tile.stairsWood.name",
	"tile.stairsWoodBirch.name",
	"tile.stairsWoodJungle.name",
	"tile.stairsWoodSpruce.name",
	"tile.stone.name",
	"tile.stoneMoss.name",
	"tile.stoneSlab.brick.name",
	"tile.stoneSlab.cobble.name",
	"tile.stoneSlab.netherBrick.name",
	"tile.stoneSlab.quartz.name",
	"tile.stoneSlab.sand.name",
	"tile.stoneSlab.smoothStoneBrick.name",
	"tile.stoneSlab.stone.name",
	"tile.stoneSlab.wood.name",
	"tile.stonebrick.name",
	"tile.stonebricksmooth.chiseled.name",
	"tile.stonebricksmooth.cracked.name",
	"tile.stonebricksmooth.default.name",
	"tile.stonebricksmooth.mossy.name",
	"tile.stonebricksmooth.name",
	"tile.tallgrass.fern.name",
	"tile.tallgrass.grass.name",
	"tile.tallgrass.name",
	"tile.tallgrass.shrub.name",
	"tile.thinGlass.name",
	"tile.tnt.name",
	"tile.torch.name",
	"tile.trapdoor.name",
	"tile.tripWire.name",
	"tile.tripWireSource.name",
	"tile.vine.name",
	"tile.water.name",
	"tile.waterlily.name",
	"tile.web.name",
	"tile.weightedPlate_heavy.name",
	"tile.weightedPlate_light.name",
	"tile.whiteStone.name",
	"tile.wood.birch.name",
	"tile.wood.jungle.name",
	"tile.wood.name",
	"tile.wood.oak.name",
	"tile.wood.spruce.name",
	"tile.woodSlab.birch.name",
	"tile.woodSlab.jungle.name",
	"tile.woodSlab.oak.name",
	"tile.woodSlab.spruce.name",
	"tile.woolCarpet.black.name",
	"tile.woolCarpet.blue.name",
	"tile.woolCarpet.brown.name",
	"tile.woolCarpet.cyan.name",
	"tile.woolCarpet.gray.name",
	"tile.woolCarpet.green.name",
	"tile.woolCarpet.lightBlue.name",
	"tile.woolCarpet.lime.name",
	"tile.woolCarpet.magenta.name",
	"tile.woolCarpet.orange.name",
	"tile.woolCarpet.pink.name",
	"tile.woolCarpet.purple.name",
	"tile.woolCarpet.red.name",
	"tile.woolCarpet.silver.name",
	"tile.woolCarpet.white.name",
	"tile.woolCarpet.yellow.name",
	"tile.workbench.name",
	"translation.test.args",
	"translation.test.complex",
	"translation.test.escape",
	"translation.test.invalid",
	"translation.test.invalid2",
	"translation.test.none",
	"translation.test.world"
]

/**MCCOMMANDS**/
var mcCommands = {
	'commands': commands,
	'params': params,
	'tags': tags,
	'structures': structures,
	'items': items,
	'blocks': blocks,
	'entities': entities,
	'achievements': achievements,
	'statistics': statistics,
	'enchantments': enchantments,
	'potions': potions,
	'sounds': sounds,
	'translatables': translatables,
	'colors': colors,
	'selectors': selectors,
	'create': createSelector
};
window['mcCommands'] = mcCommands;

})(document,window);
