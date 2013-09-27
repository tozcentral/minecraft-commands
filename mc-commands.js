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
		nameBorder: true,
		optional: false,
		ignoreValue: false,
		ignoreIfHidden: true,
		neverRequireValue: false
	}
	
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

	var row = document.createElement ( 'tr' );

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
	
	/* data */

	cell = document.createElement ( 'td' );
	
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
	
	row.appendChild ( cell );

	container.appendChild ( row );
	
	var param = {
		name: name,
		value: value,
		defaultValue: options.defaultValue,
		ignoreValue: options.ignoreValue,
		ignoreIfHidden: options.ignoreIfHidden,
		optional: options.optional,
		neverRequireValue: options.neverRequireValue,
		container: row,
		group: options.group,
		groupIndex: options.groupIndex,
		groupRadiobox: options.groupRadiobox
	};

	if ( typeof name != 'object' && this.params[name] === undefined )
		this.params[name] = param
		
	this.paramsOrdered.push ( param );
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
	this.createParam ( container, 'achievement or statistic', 'Achievement', from );
	this.createParam ( container, 'player', 'PlayerSelector', from, { optional: true } );
}

CommandAchievement.prototype = new Command ( );

function CommandClear ( container, from )
{
	this.init ( container, 'clear', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'player', 'PlayerSelector', from, { optional: true } );
	this.createParam ( container, 'item metadata', 'Item', from, { optional: true, ignoreValue: true } ); // New ParamItem, list of all items + custom
	this.createParam ( container, 'item', 'Number', from, { optional: true, ignoreIfHidden: false, min: 1 } );
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

	this.createParam ( container, 'start | stop', 'List', from, { items: ['start', 'stop'] } );
}

CommandDebug.prototype = new Command ( );

function CommandDefaultGamemode ( container, from )
{
	this.init ( container, 'defaultgamemode', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'survival | creative | adventure', 'List', from, { items: ['survival', 'creative', 'adventure'] } );
}

CommandDefaultGamemode.prototype = new Command ( );

function CommandDifficulty ( container, from )
{
	this.init ( container, 'difficulty', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'peaceful | easy | normal | hard', 'List', from, { items: ['peaceful', 'easy', 'normal', 'hard'] } );
}

CommandDifficulty.prototype = new Command ( );

function CommandEffect ( container, from )
{
	this.init ( container, 'effect', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'player', 'PlayerSelector', from );
	this.createParam ( container, 'effect', 'Potion', from );
	this.createParam ( container, 'seconds', 'Number', from, { optional: true, ignoreIfHidden: true, min:0, max:1000000, defaultValue: 30 } );
	this.createParam ( container, 'amplifier', 'Number', from, { optional: true, ignoreIfHidden: true, min:0, max:255, defaultValue: 0 } );
}

CommandEffect.prototype = new Command ( );
/*
CommandEffect.prototype.update = function ( )
{
	this.updateLoop ( );

	if ( this.params.effect.value.value === '0' )
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
	this.createParam ( container, 'enchantment', 'Enchantment', from );
	this.createParam ( container, 'level', 'Number', from, { optional: true, min:1, max:5, defaultValue: 1 } );
}

CommandEnchant.prototype = new Command ( );

CommandEnchant.prototype.update = function ( )
{
	switch ( this.params.enchantment.value.value )
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
	}

	this.updateLoop ( );
}

function CommandGamemode ( container, from )
{
	this.init ( container, 'gamemode', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'survival | creative | adventure', 'List', from, { items: ['survival', 'creative', 'adventure'] } );
	this.createParam ( container, 'player', 'PlayerSelector', from, { optional: true } );
}

CommandGamemode.prototype = new Command ( );

function CommandGameRule ( container, from )
{
	this.init ( container, 'gamerule', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'rulename', 'List', from, { items: ['commandBlockOutput', 'doFireTick', 'doMobLoot', 'doMobSpawning', 'doTileDrops', 'keepInventory', 'mobGriefing', 'naturalRegeneration', 'doDaylightCycle'] } );
	//this.createParam ( container, 'true | false', 'List', from, { items: ['true', 'false'] } );
	this.createParam ( container, 'true | false', 'Boolean', from );
}

CommandGameRule.prototype = new Command ( );

function CommandGive ( container, from )
{
	this.init ( container, 'give', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'player', 'PlayerSelector', from );
	this.createParam ( container, 'item metadata', 'Item', from, { ignoreValue: true } ); // New ParamItem, list of all items + custom
	this.createParam ( container, 'item', 'Number', from, { ignoreIfHidden: false, min:1 } );
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
	}
	
	var itemId = this.params.item.value.value;
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

	this.createParam ( container, 'sound id', 'List', from, { ignoreValue: true, items: sounds, custom: true } );
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

	this.createParam ( container, 'objectives | players | teams', 'List', from, { items: ['objectives','players','teams'] } );
	this.createParam ( container, 'objectives', ParamScoreboardObjectives, from );
	this.createParam ( container, 'players', ParamScoreboardPlayers, from );
	this.createParam ( container, 'teams', ParamScoreboardTeams, from );
	/*this.createParam ( container, 'list | add | remove | setdisplay', 'List', from, { items: ['list','add','remove','setdisplay'] } );
	this.createParam ( container, 'set | add | remove | reset | list', 'List', from, { items: ['set','add','remove','reset','list'] } );
	this.createParam ( container, 'list | add | remove | empty | join | leave | option', 'List', from, { items: ['list','add','remove','empty','join','leave','option'] } );*/
}

CommandScoreBoard.prototype = new Command ( );

function CommandSetBlock ( container, from )
{
	this.init ( container, 'setblock', '' )

	from = from && from.paramsOrdered;

	this.createParam ( container, 'x', 'Pos', from );
	this.createParam ( container, 'y', 'Pos', from, { height: true } );
	this.createParam ( container, 'z', 'Pos', from );
	this.createParam ( container, 'tilename datavalue', 'Block', from, { ignoreValue: true } );
	this.createParam ( container, 'tilename', 'Text', from, { ignoreIfHidden: false } );
	this.createParam ( container, 'datavalue', 'Number', from, { optional: true, ignoreIfHidden: false, defaultValue: 0, min:0, max:15 } );
	this.createParam ( container, 'oldblockHandling', 'List', from, { optional: true, items: ['replace','keep','destory'], defaultValue: 'replace' } );
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
	//this.createParam ( container, 'respectTeams', 'List', from, { items: ['true','false'] } );
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

	this.createParam ( container, 'Entity', 'Entity', from, { ignoreValue: true } );
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
	this.createParam ( container, 'tilename datavalue', 'Block', from, { ignoreValue: true } );
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

	this.createParam ( container, 'set | add', 'List', from, { items: ['set','add'] } );
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

	this.createParam ( container, 'clear | rain | thunder', 'List', from, { items: ['clear','rain','thunder'] } );
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

	this.setValue ( target.value );

	updateCommand ( );
}

Param.prototype.setValue = function ( v )
{
	if ( this.input )
	{
		this.value = v == this.input.placeholder ? '' : v;
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
	
	var achievements = {
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
	};
	
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

	for ( i in achievements )
	{
		option = document.createElement ( 'option' );
		option.selected = ( achievements[i] == ( value || this.options.defaultValue ) )
		option.value = 'achievement.' + i;
		option.appendChild ( document.createTextNode ( achievements[i] ) );
		optgroup.appendChild ( option );
	}

	optgroup = document.createElement ( 'optgroup' )
	optgroup.label = 'Stats';
	select.appendChild ( optgroup );

	for ( i in stats )
	{
		option = document.createElement ( 'option' );
		option.selected = ( stats[i] == ( value || this.options.defaultValue ) )
		option.value = 'stat.' + i;
		option.appendChild ( document.createTextNode ( stats[i] ) );
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
		block.uid = ( block.id + ' ' + block.data )
		
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
	
	var enchantments = {
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
	};

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

	for ( var i in enchantments )
	{
		option = document.createElement ( 'option' );
		option.selected = ( enchantments[i] == ( this.value || options && options.defaultValue ) )
		option.value = i;
		option.appendChild ( document.createTextNode ( enchantments[i] ) );
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
		item.uid = item.id + ' ' + item.data
		
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
	
	this.createParam ( container, 'item metadata', 'Item', from, { ignoreValue: true } ); // New ParamItem, list of all items + custom
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

function ParamList ( container, from, options )
{
	this.init ( container, '', options );
	
	var option;

	this.item = null;
	this.value = from && from.value;

	var select = document.createElement ( 'select' )
	select.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onValueChange ( e ) } } ) ( this ) );
	
	if ( this.options.optional && this.options.defaultValue == null )
	{
		option = document.createElement ( 'option' );
		option.value = '';
		option.appendChild ( document.createTextNode ( 'None' ) );
		select.appendChild ( option );
	}
	
	var item;
	for ( var i = 0; i < options.items.length; i++ )
	{
		item = options.items[i];
		
		if ( typeof item == 'string' )
			item = { name: item, id: item }
		
		option = document.createElement ( 'option' );
		option.value = item.id;
		option.setAttribute('data-index', i);
		option.selected = ( item.id == ( this.value || this.options.defaultValue ) )
		if ( option.selected )
			this.item = item;
		option.appendChild ( document.createTextNode ( item.name ) );
		select.appendChild ( option );
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

	container.appendChild ( select );
}

ParamList.prototype = new Param ( );

ParamList.prototype.update = function ( nextHasValue )
{
	this.setError ( false );

	var required = !this.options.optional || nextHasValue || false;

	if ( required && this.value === '' )
		this.setError ( true );
		
	var option = this.input.selectedOptions[0];
		
	if ( option )
		this.item = option.hasAttribute ( 'data-index' ) ? this.options.items[option.getAttribute ( 'data-index' )] || null : null
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
	
	var potions = {
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
	};

	this.value = from && from.value;

	var select = document.createElement ( 'select' )
	select.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onValueChange ( e ) } } ) ( this ) );

	var option = document.createElement ( 'option' );
	option.value = 'clear';
	option.appendChild ( document.createTextNode ( 'Clear' ) );
	select.appendChild ( option );

	for ( var i in potions )
	{
		var option = document.createElement ( 'option' );
		option.selected = ( potions[i] == ( this.value || options.defaultValue ) )
		option.value = i;
		option.appendChild ( document.createTextNode ( i + '. ' + potions[i] ) );
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
	this.createParam ( table, 'translate', 'Text', from, { group: 'text', groupIndex: 1, groupPrefix: this.groupPrefix, quote: true } );
	this.createParam ( table, 'color', 'Text', from, { optional: true } );
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

	this.createParam ( container, 'list | add | remove | setdisplay', 'List', from, { items: ['list','add','remove','setdisplay'] } );
}

ParamScoreboardObjectives.prototype = new Param ( );

function ParamScoreboardPlayers ( container, from, options )
{
	this.init ( container, '', options );
	
	var options = document.createElement ( 'table' );
	options.className = 'mc-scoreboard-options';
	container.appendChild ( options );

	this.createParam ( container, 'set | add | remove | reset | list', 'List', from, { items: ['set','add','remove','reset','list'] } );
}

ParamScoreboardPlayers.prototype = new Param ( );

function ParamScoreboardTeams ( container, from, options )
{
	this.init ( container, '', options );
	
	var options = document.createElement ( 'table' );
	options.className = 'mc-scoreboard-options';
	container.appendChild ( options );

	this.createParam ( container, 'list | add | remove | empty | join | leave | option', 'List', from, { items: ['list','add','remove','empty','join','leave','option'] } );
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
				type: 'Compound',
				options: {
					'Slot': 'Byte',
					'id': 'Short',
					'Damage': 'Short',
					'Count': 'Byte',
					'tag': {
						type: 'Compound',
						options: (new structures['Item'] ( )).structure
					}
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

/* Item Structures */

function StructureItem ( )
{
	this.structure = {}
	
	this.structure['ench'] = {
		type: 'List',
		options: {
			type: 'Compound',
			options: {
				'id': 'Enchantment',
				'lvl': 'Short'
			}
		}
	}
	
	this.structure['StoredEnchantments'] = {
		type: 'List',
		options: {
			type: 'Compound',
			options: {
				'id': 'Enchantment',
				'lvl': 'Short'
			}
		}
	}
	
	this.structure['RepairCost'] = 'Int'

	this.structure['display'] = {
		type: 'Compound',
		options: {
			'Name': 'String',
			'Lore': {
				type: 'List',
				options: 'String'
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
				'Id': 'Byte',
				'Amplifier': 'Byte',
				'Duration': 'Int',
				'Ambient': 'Checkbox'
			}
		}
	};
}

function StructureItemPlayerSkull ( )
{
	this.structure = (new structures['Item'] ( )).structure;

	this.structure.SkullOwner = 'String';
}

function StructureItemFireworkStar ( )
{
	this.structure = (new structures['Item'] ( )).structure;

	this.structure.Explosion = {
		'Flicker': 'Checkbox',
		'Trail': 'Checkbox',
		'Type': 'Byte',
		'Colors': {
			type: 'List',
			options: 'Int'
		},
		'FadeColors': {
			type: 'List',
			options: 'Int'
		}
	};
}

function StructureItemFirework ( )
{
	this.structure = (new structures['Item'] ( )).structure;

	this.structure.Fireworks = {
		type: 'Compound',
		options: {
			'Flight': 'Byte',
			'Explosions': {
				'Flicker': 'Checkbox',
				'Trail': 'Checkbox',
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
		'Dimmension': 'Int',
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
	//this.structure['Item'] = ;
	//this.structure['SaddleItem'] = ;
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
			'Recipes': {
				type: 'List',
				options: {
					type: 'Compound',
					options: {
						'maxUses': 'Int',
						'uses': 'Int',
						/*'buy': {
						},
						'buyB': {
						},
						'sell': {
						}*/
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
	this.structure = {
		'xTile': 'Short',
		'yTile': 'Short',
		'zTile': 'Short',
		'inTile': 'Byte',
		'shake': 'Byte',
		'inGround': 'Byte'
	};
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
}

function StructureEntityMinecartTNT ( )
{
	this.structure = (new structures['EntityMinecart'] ( )).structure;
	this.structure['TNTFuse'] = 'Int';
}

function StructureEntityMinecartSpawner ( )
{
	this.structure = (new structures['EntityMinecart'] ( )).structure;
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
	//this.structure['FireworksItem'] = ;
}

function StructureEntityItem ( )
{
	this.structure = (new structures['Entity'] ( )).structure
	//this.structure.Item
}

function StructureEntityItemFrame ( )
{
	this.structure = (new structures['EntityPaintingLike'] ( )).structure;
	//this.structure['Item'] = 'Byte';
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

Tag.prototype.init = function ( container, description, options )
{
	var defaultOptions = {
		optional: true
	};
	
	options = mergeObjects ( options, defaultOptions );
	
	this.container = container
	
	this.description = description
	
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
	if ( this.tags || this.customs )
	{
		if ( this.tags && this.tags instanceof Array )
		{
			var output = '';

			for ( var i = 0; i < this.tags.length; i++ )
			{
				var value = this.tags[i].value.toString ( );
				if ( value !== '' )
				{
					if ( output !== '' )
						output += ','
					output += value
				}
			}

			if ( output !== '' )
				output = '[' + output + ']';
		}
		else
		{
			var output = '';

			if ( this.tags )
			{
				for ( var tag in this.tags )
				{
					var value = this.tags[tag].value.toString ( );
					if ( value !== '' )
					{
						if ( output !== '' )
							output += ','
						output += tag + ':' + value
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
							if ( output !== '' )
								output += ','
							output += name + ( value !== '' ? ':' + value : '' )
						}
					}
				}
			}

			if ( output !== '' )
				output = '{' + output + '}';
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
	//var table = this.createTable ( this.div, true );
	var div = document.createElement ( 'div' );
	//div.className = 'mc-tag-options';

	if ( this.count === '*' )
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
	
	this.selector = new params['Entity'] ( container, from && from.selector, { optional: this.options.optional } );
	this.id = new params['Text'] ( container, from && from.id, { optional: this.options.optional } );
	
	var div = document.createElement ( 'div' )
	container.appendChild ( div )
	
	this.container = div;
	
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
	
	this.selector.update ( );
	this.id.update ( );
	this.tag.update ( );
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
	'Achievement': ParamAchievement,
	'Boolean': ParamBoolean,
	'Block': ParamBlock,
	'CommandSelector': ParamCommandSelector,
	'DataTag': ParamDataTag,
	'Enchantment': ParamEnchantment,
	'Entity': ParamEntity,
	'Item': ParamItem,
	'List': ParamList,
	'Number': ParamNumber,
	'PlayerSelector': ParamPlayerSelector,
	'Pos': ParamPos,
	'Potion': ParamPotion,
	'RawMessage': ParamRawMessage,
	'RawMessageEvent': ParamRawMessageEvent,
	'RawMessageExtras': ParamRawMessageExtras,
	'Sound': ParamSound,
	'Static': ParamStatic,
	'Text': ParamText,
	'XP': ParamXP
}

/**TAGS**/
tags = {
	'Compound': TagCompound,
	'List': TagList,
	
	'Byte': TagShort,
	'Double': TagFloat,
	'Float': TagFloat,
	'Int': TagShort,
	'Long': TagShort,
	'Short': TagShort,
	'String': TagString,
	
	'Boolean': TagBoolean,
	'CommandSelector': TagCommandSelector,
	'Enchantment': TagEnchantment,
	'Entity': TagEntity,
	'Replace': TagReplace,
	'RGB': TagShort
}

/**STRUCTURE**/
structures = {
	'Inventory': StructureInventory,
	
	'Block': StructureBlock,
	
	'Item': StructureItem,
	'ItemBookAndQuill': StructureItemBookAndQuill,
	'ItemWrittenBook': StructureItemWrittenBook,
	'ItemColourable': StructureItemColourable,
	
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

//** BLOCKS AND ITEMS GO HERE **//

blocks = [
{id:1,data:0,name:"Stone"},
{id:2,data:0,name:"Grass Block"},
{id:3,data:0,name:"Dirt"},
{id:3,data:1,name:"Grassless Dirt"},
{id:3,data:2,name:"Podzol"},
{id:4,data:0,name:"Cobblestone"},
{id:5,data:0,name:"Oak Wood Planks"},
{id:5,data:1,name:"Spruce Wood Planks"},
{id:5,data:2,name:"Birch Wood Planks"},
{id:5,data:3,name:"Jungle Wood Planks"},
{id:6,data:0,name:"Oak Sapling"},
{id:6,data:1,name:"Spruce Sapling"},
{id:6,data:2,name:"Birch Sapling"},
{id:6,data:3,name:"Jungle Sapling"},
{id:7,data:0,name:"Bedrock"},
{id:8,data:0,name:"Flowing Water"},
{id:9,data:0,name:"Still Water"},
{id:10,data:0,name:"Flowing Lava"},
{id:11,data:0,name:"Still Lava"},
{id:12,data:0,name:"Sand"},
{id:13,data:0,name:"Gravel"},
{id:14,data:0,name:"Gold Ore"},
{id:15,data:0,name:"Iron Ore"},
{id:16,data:0,name:"Coal Ore"},
{id:17,data:0,name:"Oak Wood"},
{id:17,data:1,name:"Spruce Wood"},
{id:17,data:2,name:"Birch Wood"},
{id:17,data:3,name:"Jungle Wood"},
{id:18,data:0,name:"Oak Leaves"},
{id:18,data:1,name:"Spruce Leaves"},
{id:18,data:2,name:"Birch Leaves"},
{id:18,data:3,name:"Jungle Leaves"},
{id:19,data:0,name:"Sponge"},
{id:20,data:0,name:"Glass"},
{id:21,data:0,name:"Lapis Lazuli Ore"},
{id:22,data:0,name:"Lapis Lazuli Block"},
{id:23,data:0,name:"Dispenser",structure:"Inventory"},
{id:24,data:0,name:"Sandstone"},
{id:24,data:1,name:"Chiseled Sandstone"},
{id:24,data:2,name:"Smooth Sandstone"},
{id:25,data:0,name:"Note Block"},
{id:26,data:0,name:"Bed"},
{id:27,data:0,name:"Powered Rail"},
{id:28,data:0,name:"Detector Rail"},
{id:29,data:0,name:"Sticky Piston"},
{id:30,data:0,name:"Cobweb"},
{id:31,data:1,name:"Tall Grass"},
{id:31,data:2,name:"Fern"},
{id:32,data:0,name:"Dead Bush"},
{id:33,data:0,name:"Piston"},
{id:35,data:0,name:"White Wool"},
{id:35,data:1,name:"Orange Wool"},
{id:35,data:2,name:"Magenta Wool"},
{id:35,data:3,name:"Light Blue Wool"},
{id:35,data:4,name:"Yellow Wool"},
{id:35,data:5,name:"Lime Wool"},
{id:35,data:6,name:"Pink Wool"},
{id:35,data:7,name:"Gray Wool"},
{id:35,data:8,name:"Light Gray Wool"},
{id:35,data:9,name:"Cyan Wool"},
{id:35,data:10,name:"Purple Wool"},
{id:35,data:11,name:"Blue Wool"},
{id:35,data:12,name:"Brown Wool"},
{id:35,data:13,name:"Green Wool"},
{id:35,data:14,name:"Red Wool"},
{id:35,data:15,name:"Black Wool"},
{id:37,data:0,name:"Flower"},
{id:38,data:0,name:"Rose"},
{id:39,data:0,name:"Brown Mushroom"},
{id:40,data:0,name:"Red Mushroom"},
{id:41,data:0,name:"Block of Gold"},
{id:42,data:0,name:"Block of Iron"},
{id:44,data:0,name:"Stone Slab"},
{id:44,data:1,name:"Sandstone Slab"},
{id:44,data:3,name:"Cobblestone Slab"},
{id:44,data:4,name:"Bricks Slab"},
{id:44,data:5,name:"Stone Bricks Slab"},
{id:44,data:6,name:"Nether Brick Slab"},
{id:44,data:7,name:"Quartz Slab"},
{id:45,data:0,name:"Bricks"},
{id:46,data:0,name:"TNT"},
{id:47,data:0,name:"Bookshelf"},
{id:48,data:0,name:"Moss Stone"},
{id:49,data:0,name:"Obsidian"},
{id:50,data:0,name:"Torch"},
{id:51,data:0,name:"Fire"},
{id:52,data:0,name:"Monster Spawner"},
{id:53,data:0,name:"Oak Wood Stairs"},
{id:54,data:0,name:"Chest",structure:"Inventory"},
{id:55,data:0,name:"Redstone Dust"},
{id:56,data:0,name:"Diamond Ore"},
{id:57,data:0,name:"Block of Diamond"},
{id:58,data:0,name:"Crafting Table"},
{id:59,data:0,name:"Crops"},
{id:60,data:0,name:"Farmland"},
{id:61,data:0,name:"Furnace"},
{id:62,data:0,name:"Furnace (Lit)"},
{id:63,data:0,name:"Sign"},
{id:64,data:0,name:"Wooden Door"},
{id:65,data:0,name:"Ladder"},
{id:66,data:0,name:"Rail"},
{id:67,data:0,name:"Stone Stairs"},
{id:68,data:0,name:"Sign"},
{id:69,data:0,name:"Lever"},
{id:70,data:0,name:"Pressure Plate"},
{id:71,data:0,name:"Iron Door"},
{id:72,data:0,name:"Pressure Plate"},
{id:73,data:0,name:"Redstone Ore"},
{id:74,data:0,name:"Redstone Ore"},
{id:75,data:0,name:"Redstone Torch"},
{id:76,data:0,name:"Redstone Torch"},
{id:77,data:0,name:"Button"},
{id:78,data:0,name:"Snow"},
{id:79,data:0,name:"Ice"},
{id:80,data:0,name:"Snow"},
{id:81,data:0,name:"Cactus"},
{id:82,data:0,name:"Clay"},
{id:83,data:0,name:"Sugar cane"},
{id:84,data:0,name:"Jukebox"},
{id:85,data:0,name:"Fence"},
{id:86,data:0,name:"Pumpkin"},
{id:87,data:0,name:"Netherrack"},
{id:88,data:0,name:"Soul Sand"},
{id:89,data:0,name:"Glowstone"},
{id:90,data:0,name:"Portal"},
{id:91,data:0,name:"Jack o'Lantern"},
{id:92,data:0,name:"Cake"},
{id:93,data:0,name:"tile.diode.name"},
{id:94,data:0,name:"tile.diode.name"},
{id:95,data:0,name:"Locked chest"},
{id:96,data:0,name:"Trapdoor"},
{id:97,data:0,name:"Stone Monster Egg"},
{id:97,data:1,name:"Cobblestone Monster Egg"},
{id:97,data:2,name:"Stone Brick Monster Egg"},
{id:98,data:0,name:"Stone Bricks"},
{id:98,data:1,name:"Mossy Stone Bricks"},
{id:98,data:2,name:"Cracked Stone Bricks"},
{id:98,data:3,name:"Chiseled Stone Bricks"},
{id:99,data:0,name:"Mushroom"},
{id:100,data:0,name:"Mushroom"},
{id:101,data:0,name:"Iron Bars"},
{id:102,data:0,name:"Glass Pane"},
{id:103,data:0,name:"Melon"},
{id:104,data:0,name:"tile.pumpkinStem.name"},
{id:105,data:0,name:"tile.pumpkinStem.name"},
{id:106,data:0,name:"Vines"},
{id:107,data:0,name:"Fence Gate"},
{id:108,data:0,name:"Brick Stairs"},
{id:109,data:0,name:"Stone Brick Stairs"},
{id:110,data:0,name:"Mycelium"},
{id:111,data:0,name:"Lily Pad"},
{id:112,data:0,name:"Nether Brick"},
{id:113,data:0,name:"Nether Brick Fence"},
{id:114,data:0,name:"Nether Brick Stairs"},
{id:115,data:0,name:"Nether Wart"},
{id:116,data:0,name:"Enchantment Table"},
{id:117,data:0,name:"tile.brewingStand.name"},
{id:118,data:0,name:"Cauldron"},
{id:119,data:0,name:"tile.null.name"},
{id:120,data:0,name:"End Portal"},
{id:121,data:0,name:"End Stone"},
{id:122,data:0,name:"Dragon Egg"},
{id:123,data:0,name:"Redstone Lamp"},
{id:124,data:0,name:"Redstone Lamp"},
{id:126,data:0,name:"Oak Wood Slab"},
{id:126,data:1,name:"Spruce Wood Slab"},
{id:126,data:2,name:"Birch Wood Slab"},
{id:126,data:3,name:"Jungle Wood Slab"},
{id:127,data:0,name:"Cocoa"},
{id:128,data:0,name:"Sandstone Stairs"},
{id:129,data:0,name:"Emerald Ore"},
{id:130,data:0,name:"Ender Chest"},
{id:131,data:0,name:"Tripwire Hook"},
{id:132,data:0,name:"Tripwire"},
{id:133,data:0,name:"Block of Emerald"},
{id:134,data:0,name:"Spruce Wood Stairs"},
{id:135,data:0,name:"Birch Wood Stairs"},
{id:136,data:0,name:"Jungle Wood Stairs"},
{id:137,data:0,name:"Command Block"},
{id:138,data:0,name:"Beacon"},
{id:139,data:0,name:"Cobblestone Wall"},
{id:139,data:1,name:"Mossy Cobblestone Wall"},
{id:140,data:0,name:"tile.flowerPot.name"},
{id:141,data:0,name:"Carrots"},
{id:142,data:0,name:"Potatoes"},
{id:143,data:0,name:"Button"},
{id:144,data:0,name:"tile.skull.name"},
{id:145,data:0,name:"Anvil"},
{id:145,data:1,name:"Slightly Damaged Anvil"},
{id:145,data:2,name:"Very Damaged Anvil"},
{id:146,data:0,name:"Trapped Chest",structure:"Inventory"},
{id:147,data:0,name:"Weighted Pressure Plate (Light)"},
{id:148,data:0,name:"Weighted Pressure Plate (Heavy)"},
{id:149,data:0,name:"tile.comparator.name"},
{id:150,data:0,name:"tile.comparator.name"},
{id:151,data:0,name:"Daylight Sensor"},
{id:152,data:0,name:"Block of Redstone"},
{id:153,data:0,name:"Nether Quartz Ore"},
{id:154,data:0,name:"Hopper"},
{id:155,data:0,name:"Block of Quartz"},
{id:155,data:1,name:"Chiseled Quartz Block"},
{id:155,data:2,name:"Pillar Quartz Block"},
{id:156,data:0,name:"Quartz Stairs"},
{id:157,data:0,name:"Activator Rail"},
{id:158,data:0,name:"Dropper",structure:"Inventory"},
{id:159,data:0,name:"White Stained Clay"},
{id:159,data:1,name:"Orange Stained Clay"},
{id:159,data:2,name:"Magenta Stained Clay"},
{id:159,data:3,name:"Light Blue Stained Clay"},
{id:159,data:4,name:"Yellow Stained Clay"},
{id:159,data:5,name:"Lime Stained Clay"},
{id:159,data:6,name:"Pink Stained Clay"},
{id:159,data:7,name:"Gray Stained Clay"},
{id:159,data:8,name:"Light Gray Stained Clay"},
{id:159,data:9,name:"Cyan Stained Clay"},
{id:159,data:10,name:"Purple Stained Clay"},
{id:159,data:11,name:"Blue Stained Clay"},
{id:159,data:12,name:"Brown Stained Clay"},
{id:159,data:13,name:"Green Stained Clay"},
{id:159,data:14,name:"Red Stained Clay"},
{id:159,data:15,name:"Black Stained Clay"},
{id:170,data:0,name:"Hay Bale"},
{id:171,data:0,name:"Carpet"},
{id:171,data:1,name:"Orange Carpet"},
{id:171,data:2,name:"Magenta Carpet"},
{id:171,data:3,name:"Light Blue Carpet"},
{id:171,data:4,name:"Yellow Carpet"},
{id:171,data:5,name:"Lime Carpet"},
{id:171,data:6,name:"Pink Carpet"},
{id:171,data:7,name:"Gray Carpet"},
{id:171,data:8,name:"Light Gray Carpet"},
{id:171,data:9,name:"Cyan Carpet"},
{id:171,data:10,name:"Purple Carpet"},
{id:171,data:11,name:"Blue Carpet"},
{id:171,data:12,name:"Brown Carpet"},
{id:171,data:13,name:"Green Carpet"},
{id:171,data:14,name:"Red Carpet"},
{id:171,data:15,name:"Black Carpet"},
{id:172,data:0,name:"Hardened Clay"},
{id:173,data:0,name:"Block of Coal"},
{id:174,data:0,name:"Packed Ice"},
{id:175,data:0,name:"Sunflower"},
{id:175,data:1,name:"Lilac"},
{id:175,data:2,name:"Double Tall Grass"},
{id:175,data:3,name:"Large Fern"},
{id:175,data:4,name:"RoseBush"},
{id:175,data:5,name:"Peony"}
];
items = [
{id:1,data:0,name:"Stone"},
{id:2,data:0,name:"Grass Block"},
{id:3,data:0,name:"Dirt"},
{id:3,data:1,name:"Grassless Dirt"},
{id:3,data:2,name:"Podzol"},
{id:4,data:0,name:"Cobblestone"},
{id:5,data:0,name:"Oak Wood Planks"},
{id:5,data:1,name:"Spruce Wood Planks"},
{id:5,data:2,name:"Birch Wood Planks"},
{id:5,data:3,name:"Jungle Wood Planks"},
{id:6,data:0,name:"Oak Sapling"},
{id:6,data:1,name:"Spruce Sapling"},
{id:6,data:2,name:"Birch Sapling"},
{id:6,data:3,name:"Jungle Sapling"},
{id:7,data:0,name:"Bedrock"},
{id:8,data:0,name:"Flowing Water"},
{id:9,data:0,name:"Still Water"},
{id:10,data:0,name:"Flowing Lava"},
{id:11,data:0,name:"Still Lava"},
{id:12,data:0,name:"Sand"},
{id:13,data:0,name:"Gravel"},
{id:14,data:0,name:"Gold Ore"},
{id:15,data:0,name:"Iron Ore"},
{id:16,data:0,name:"Coal Ore"},
{id:17,data:0,name:"Oak Wood"},
{id:17,data:1,name:"Spruce Wood"},
{id:17,data:2,name:"Birch Wood"},
{id:17,data:3,name:"Jungle Wood"},
{id:18,data:0,name:"Oak Leaves"},
{id:18,data:1,name:"Spruce Leaves"},
{id:18,data:2,name:"Birch Leaves"},
{id:18,data:3,name:"Jungle Leaves"},
{id:19,data:0,name:"Sponge"},
{id:20,data:0,name:"Glass"},
{id:21,data:0,name:"Lapis Lazuli Ore"},
{id:22,data:0,name:"Lapis Lazuli Block"},
{id:23,data:0,name:"Dispenser"},
{id:24,data:0,name:"Sandstone"},
{id:24,data:1,name:"Chiseled Sandstone"},
{id:24,data:2,name:"Smooth Sandstone"},
{id:25,data:0,name:"Note Block"},
{id:26,data:0,name:"Bed"},
{id:27,data:0,name:"Powered Rail"},
{id:28,data:0,name:"Detector Rail"},
{id:29,data:0,name:"Sticky Piston"},
{id:30,data:0,name:"Cobweb"},
{id:31,data:1,name:"Tall Grass"},
{id:31,data:2,name:"Fern"},
{id:32,data:0,name:"Dead Bush"},
{id:33,data:0,name:"Piston"},
{id:35,data:0,name:"White Wool"},
{id:35,data:1,name:"Orange Wool"},
{id:35,data:2,name:"Magenta Wool"},
{id:35,data:3,name:"Light Blue Wool"},
{id:35,data:4,name:"Yellow Wool"},
{id:35,data:5,name:"Lime Wool"},
{id:35,data:6,name:"Pink Wool"},
{id:35,data:7,name:"Gray Wool"},
{id:35,data:8,name:"Light Gray Wool"},
{id:35,data:9,name:"Cyan Wool"},
{id:35,data:10,name:"Purple Wool"},
{id:35,data:11,name:"Blue Wool"},
{id:35,data:12,name:"Brown Wool"},
{id:35,data:13,name:"Green Wool"},
{id:35,data:14,name:"Red Wool"},
{id:35,data:15,name:"Black Wool"},
{id:37,data:0,name:"Flower"},
{id:38,data:0,name:"Rose"},
{id:39,data:0,name:"Brown Mushroom"},
{id:40,data:0,name:"Red Mushroom"},
{id:41,data:0,name:"Block of Gold"},
{id:42,data:0,name:"Block of Iron"},
{id:44,data:0,name:"Stone Slab"},
{id:44,data:1,name:"Sandstone Slab"},
{id:44,data:3,name:"Cobblestone Slab"},
{id:44,data:4,name:"Bricks Slab"},
{id:44,data:5,name:"Stone Bricks Slab"},
{id:44,data:6,name:"Nether Brick Slab"},
{id:44,data:7,name:"Quartz Slab"},
{id:45,data:0,name:"Bricks"},
{id:46,data:0,name:"TNT"},
{id:47,data:0,name:"Bookshelf"},
{id:48,data:0,name:"Moss Stone"},
{id:49,data:0,name:"Obsidian"},
{id:50,data:0,name:"Torch"},
{id:51,data:0,name:"Fire"},
{id:52,data:0,name:"Monster Spawner"},
{id:53,data:0,name:"Oak Wood Stairs"},
{id:54,data:0,name:"Chest"},
{id:55,data:0,name:"Redstone Dust"},
{id:56,data:0,name:"Diamond Ore"},
{id:57,data:0,name:"Block of Diamond"},
{id:58,data:0,name:"Crafting Table"},
{id:59,data:0,name:"Crops"},
{id:60,data:0,name:"Farmland"},
{id:61,data:0,name:"Furnace"},
{id:62,data:0,name:"Furnace (Lit)"},
{id:63,data:0,name:"Sign"},
{id:64,data:0,name:"Wooden Door"},
{id:65,data:0,name:"Ladder"},
{id:66,data:0,name:"Rail"},
{id:67,data:0,name:"Stone Stairs"},
{id:68,data:0,name:"Sign"},
{id:69,data:0,name:"Lever"},
{id:70,data:0,name:"Pressure Plate"},
{id:71,data:0,name:"Iron Door"},
{id:72,data:0,name:"Pressure Plate"},
{id:73,data:0,name:"Redstone Ore"},
{id:74,data:0,name:"Redstone Ore"},
{id:75,data:0,name:"Redstone Torch"},
{id:76,data:0,name:"Redstone Torch"},
{id:77,data:0,name:"Button"},
{id:78,data:0,name:"Snow"},
{id:79,data:0,name:"Ice"},
{id:80,data:0,name:"Snow"},
{id:81,data:0,name:"Cactus"},
{id:82,data:0,name:"Clay"},
{id:83,data:0,name:"Sugar cane"},
{id:84,data:0,name:"Jukebox"},
{id:85,data:0,name:"Fence"},
{id:86,data:0,name:"Pumpkin"},
{id:87,data:0,name:"Netherrack"},
{id:88,data:0,name:"Soul Sand"},
{id:89,data:0,name:"Glowstone"},
{id:90,data:0,name:"Portal"},
{id:91,data:0,name:"Jack o'Lantern"},
{id:92,data:0,name:"Cake"},
{id:93,data:0,name:"tile.diode.name"},
{id:94,data:0,name:"tile.diode.name"},
{id:95,data:0,name:"Locked chest"},
{id:96,data:0,name:"Trapdoor"},
{id:97,data:0,name:"Stone Monster Egg"},
{id:97,data:1,name:"Cobblestone Monster Egg"},
{id:97,data:2,name:"Stone Brick Monster Egg"},
{id:98,data:0,name:"Stone Bricks"},
{id:98,data:1,name:"Mossy Stone Bricks"},
{id:98,data:2,name:"Cracked Stone Bricks"},
{id:98,data:3,name:"Chiseled Stone Bricks"},
{id:99,data:0,name:"Mushroom"},
{id:100,data:0,name:"Mushroom"},
{id:101,data:0,name:"Iron Bars"},
{id:102,data:0,name:"Glass Pane"},
{id:103,data:0,name:"Melon"},
{id:104,data:0,name:"tile.pumpkinStem.name"},
{id:105,data:0,name:"tile.pumpkinStem.name"},
{id:106,data:0,name:"Vines"},
{id:107,data:0,name:"Fence Gate"},
{id:108,data:0,name:"Brick Stairs"},
{id:109,data:0,name:"Stone Brick Stairs"},
{id:110,data:0,name:"Mycelium"},
{id:111,data:0,name:"Lily Pad"},
{id:112,data:0,name:"Nether Brick"},
{id:113,data:0,name:"Nether Brick Fence"},
{id:114,data:0,name:"Nether Brick Stairs"},
{id:115,data:0,name:"Nether Wart"},
{id:116,data:0,name:"Enchantment Table"},
{id:117,data:0,name:"tile.brewingStand.name"},
{id:118,data:0,name:"Cauldron"},
{id:119,data:0,name:"tile.null.name"},
{id:120,data:0,name:"End Portal"},
{id:121,data:0,name:"End Stone"},
{id:122,data:0,name:"Dragon Egg"},
{id:123,data:0,name:"Redstone Lamp"},
{id:124,data:0,name:"Redstone Lamp"},
{id:126,data:0,name:"Oak Wood Slab"},
{id:126,data:1,name:"Spruce Wood Slab"},
{id:126,data:2,name:"Birch Wood Slab"},
{id:126,data:3,name:"Jungle Wood Slab"},
{id:127,data:0,name:"Cocoa"},
{id:128,data:0,name:"Sandstone Stairs"},
{id:129,data:0,name:"Emerald Ore"},
{id:130,data:0,name:"Ender Chest"},
{id:131,data:0,name:"Tripwire Hook"},
{id:132,data:0,name:"Tripwire"},
{id:133,data:0,name:"Block of Emerald"},
{id:134,data:0,name:"Spruce Wood Stairs"},
{id:135,data:0,name:"Birch Wood Stairs"},
{id:136,data:0,name:"Jungle Wood Stairs"},
{id:137,data:0,name:"Command Block"},
{id:138,data:0,name:"Beacon"},
{id:139,data:0,name:"Cobblestone Wall"},
{id:139,data:1,name:"Mossy Cobblestone Wall"},
{id:140,data:0,name:"tile.flowerPot.name"},
{id:141,data:0,name:"Carrots"},
{id:142,data:0,name:"Potatoes"},
{id:143,data:0,name:"Button"},
{id:144,data:0,name:"tile.skull.name"},
{id:145,data:0,name:"Anvil"},
{id:145,data:1,name:"Slightly Damaged Anvil"},
{id:145,data:2,name:"Very Damaged Anvil"},
{id:146,data:0,name:"Trapped Chest"},
{id:147,data:0,name:"Weighted Pressure Plate (Light)"},
{id:148,data:0,name:"Weighted Pressure Plate (Heavy)"},
{id:149,data:0,name:"tile.comparator.name"},
{id:150,data:0,name:"tile.comparator.name"},
{id:151,data:0,name:"Daylight Sensor"},
{id:152,data:0,name:"Block of Redstone"},
{id:153,data:0,name:"Nether Quartz Ore"},
{id:154,data:0,name:"Hopper"},
{id:155,data:0,name:"Block of Quartz"},
{id:155,data:1,name:"Chiseled Quartz Block"},
{id:155,data:2,name:"Pillar Quartz Block"},
{id:156,data:0,name:"Quartz Stairs"},
{id:157,data:0,name:"Activator Rail"},
{id:158,data:0,name:"Dropper"},
{id:159,data:0,name:"White Stained Clay"},
{id:159,data:1,name:"Orange Stained Clay"},
{id:159,data:2,name:"Magenta Stained Clay"},
{id:159,data:3,name:"Light Blue Stained Clay"},
{id:159,data:4,name:"Yellow Stained Clay"},
{id:159,data:5,name:"Lime Stained Clay"},
{id:159,data:6,name:"Pink Stained Clay"},
{id:159,data:7,name:"Gray Stained Clay"},
{id:159,data:8,name:"Light Gray Stained Clay"},
{id:159,data:9,name:"Cyan Stained Clay"},
{id:159,data:10,name:"Purple Stained Clay"},
{id:159,data:11,name:"Blue Stained Clay"},
{id:159,data:12,name:"Brown Stained Clay"},
{id:159,data:13,name:"Green Stained Clay"},
{id:159,data:14,name:"Red Stained Clay"},
{id:159,data:15,name:"Black Stained Clay"},
{id:170,data:0,name:"Hay Bale"},
{id:171,data:0,name:"Carpet"},
{id:171,data:1,name:"Orange Carpet"},
{id:171,data:2,name:"Magenta Carpet"},
{id:171,data:3,name:"Light Blue Carpet"},
{id:171,data:4,name:"Yellow Carpet"},
{id:171,data:5,name:"Lime Carpet"},
{id:171,data:6,name:"Pink Carpet"},
{id:171,data:7,name:"Gray Carpet"},
{id:171,data:8,name:"Light Gray Carpet"},
{id:171,data:9,name:"Cyan Carpet"},
{id:171,data:10,name:"Purple Carpet"},
{id:171,data:11,name:"Blue Carpet"},
{id:171,data:12,name:"Brown Carpet"},
{id:171,data:13,name:"Green Carpet"},
{id:171,data:14,name:"Red Carpet"},
{id:171,data:15,name:"Black Carpet"},
{id:172,data:0,name:"Hardened Clay"},
{id:173,data:0,name:"Block of Coal"},
{id:256,data:0,name:"Iron Shovel"},
{id:257,data:0,name:"Iron Pickaxe"},
{id:258,data:0,name:"Iron Axe"},
{id:259,data:0,name:"Flint and Steel"},
{id:260,data:0,name:"Apple"},
{id:261,data:0,name:"Bow"},
{id:262,data:0,name:"Arrow"},
{id:263,data:0,name:"Coal"},
{id:263,data:1,name:"Charcoal"},
{id:264,data:0,name:"Diamond"},
{id:265,data:0,name:"Iron Ingot"},
{id:266,data:0,name:"Gold Ingot"},
{id:267,data:0,name:"Iron Sword"},
{id:268,data:0,name:"Wooden Sword"},
{id:269,data:0,name:"Wooden Shovel"},
{id:270,data:0,name:"Wooden Pickaxe"},
{id:271,data:0,name:"Wooden Axe"},
{id:272,data:0,name:"Stone Sword"},
{id:273,data:0,name:"Stone Shovel"},
{id:274,data:0,name:"Stone Pickaxe"},
{id:275,data:0,name:"Stone Axe"},
{id:276,data:0,name:"Diamond Sword"},
{id:277,data:0,name:"Diamond Shovel"},
{id:278,data:0,name:"Diamond Pickaxe"},
{id:279,data:0,name:"Diamond Axe"},
{id:280,data:0,name:"Stick"},
{id:281,data:0,name:"Bowl"},
{id:282,data:0,name:"Mushroom Stew"},
{id:283,data:0,name:"Golden Sword"},
{id:284,data:0,name:"Golden Shovel"},
{id:285,data:0,name:"Golden Pickaxe"},
{id:286,data:0,name:"Golden Axe"},
{id:287,data:0,name:"String"},
{id:288,data:0,name:"Feather"},
{id:289,data:0,name:"Gunpowder"},
{id:290,data:0,name:"Wooden Hoe"},
{id:291,data:0,name:"Stone Hoe"},
{id:292,data:0,name:"Iron Hoe"},
{id:293,data:0,name:"Diamond Hoe"},
{id:294,data:0,name:"Golden Hoe"},
{id:295,data:0,name:"Seeds"},
{id:296,data:0,name:"Wheat"},
{id:297,data:0,name:"Bread"},
{id:298,data:0,name:"Leather Cap"},
{id:299,data:0,name:"Leather Tunic"},
{id:300,data:0,name:"Leather Pants"},
{id:301,data:0,name:"Leather Boots"},
{id:302,data:0,name:"Chain Helmet"},
{id:303,data:0,name:"Chain Chestplate"},
{id:304,data:0,name:"Chain Leggings"},
{id:305,data:0,name:"Chain Boots"},
{id:306,data:0,name:"Iron Helmet"},
{id:307,data:0,name:"Iron Chestplate"},
{id:308,data:0,name:"Iron Leggings"},
{id:309,data:0,name:"Iron Boots"},
{id:310,data:0,name:"Diamond Helmet"},
{id:311,data:0,name:"Diamond Chestplate"},
{id:312,data:0,name:"Diamond Leggings"},
{id:313,data:0,name:"Diamond Boots"},
{id:314,data:0,name:"Golden Helmet"},
{id:315,data:0,name:"Golden Chestplate"},
{id:316,data:0,name:"Golden Leggings"},
{id:317,data:0,name:"Golden Boots"},
{id:318,data:0,name:"Flint"},
{id:319,data:0,name:"Raw Porkchop"},
{id:320,data:0,name:"Cooked Porkchop"},
{id:321,data:0,name:"Painting"},
{id:322,data:0,name:"Golden Apple"},
{id:322,data:1,name:"Golden Apple"},
{id:323,data:0,name:"Sign"},
{id:324,data:0,name:"Wooden Door"},
{id:325,data:0,name:"Bucket"},
{id:326,data:0,name:"Water Bucket"},
{id:327,data:0,name:"Lava Bucket"},
{id:328,data:0,name:"Minecart"},
{id:329,data:0,name:"Saddle"},
{id:330,data:0,name:"Iron Door"},
{id:331,data:0,name:"Redstone"},
{id:332,data:0,name:"Snowball"},
{id:333,data:0,name:"Boat"},
{id:334,data:0,name:"Leather"},
{id:335,data:0,name:"Milk"},
{id:336,data:0,name:"Brick"},
{id:337,data:0,name:"Clay"},
{id:338,data:0,name:"Sugar Canes"},
{id:339,data:0,name:"Paper"},
{id:340,data:0,name:"Book"},
{id:341,data:0,name:"Slimeball"},
{id:342,data:0,name:"Minecart with Chest"},
{id:343,data:0,name:"Minecart with Furnace"},
{id:344,data:0,name:"Egg"},
{id:345,data:0,name:"Compass"},
{id:346,data:0,name:"Fishing Rod"},
{id:347,data:0,name:"Clock"},
{id:348,data:0,name:"Glowstone Dust"},
{id:349,data:0,name:"Raw Fish"},
{id:350,data:0,name:"Cooked Fish"},
{id:351,data:0,name:"Ink Sac"},
{id:351,data:1,name:"Rose Red"},
{id:351,data:2,name:"Cactus Green"},
{id:351,data:3,name:"Cocoa Beans"},
{id:351,data:4,name:"Lapis Lazuli"},
{id:351,data:5,name:"Purple Dye"},
{id:351,data:6,name:"Cyan Dye"},
{id:351,data:7,name:"Light Gray Dye"},
{id:351,data:8,name:"Gray Dye"},
{id:351,data:9,name:"Pink Dye"},
{id:351,data:10,name:"Lime Dye"},
{id:351,data:11,name:"Dandelion Yellow"},
{id:351,data:12,name:"Light Blue Dye"},
{id:351,data:13,name:"Magenta Dye"},
{id:351,data:14,name:"Orange Dye"},
{id:351,data:15,name:"Bone Meal"},
{id:352,data:0,name:"Bone"},
{id:353,data:0,name:"Sugar"},
{id:354,data:0,name:"Cake"},
{id:355,data:0,name:"Bed"},
{id:356,data:0,name:"Redstone Repeater"},
{id:357,data:0,name:"Cookie"},
{id:358,data:0,name:"Map"},
{id:359,data:0,name:"Shears"},
{id:360,data:0,name:"Melon"},
{id:361,data:0,name:"Pumpkin Seeds"},
{id:362,data:0,name:"Melon Seeds"},
{id:363,data:0,name:"Raw Beef"},
{id:364,data:0,name:"Steak"},
{id:365,data:0,name:"Raw Chicken"},
{id:366,data:0,name:"Cooked Chicken"},
{id:367,data:0,name:"Rotten Flesh"},
{id:368,data:0,name:"Ender Pearl"},
{id:369,data:0,name:"Blaze Rod"},
{id:370,data:0,name:"Ghast Tear"},
{id:371,data:0,name:"Gold Nugget"},
{id:372,data:0,name:"Nether Wart"},
{id:373,data:0,name:"Potion"},
{id:373,data:8193,name:"Potion"},
{id:373,data:8225,name:"Potion"},
{id:373,data:8257,name:"Potion"},
{id:373,data:16385,name:"Potion"},
{id:373,data:16417,name:"Potion"},
{id:373,data:16449,name:"Potion"},
{id:373,data:8194,name:"Potion"},
{id:373,data:8226,name:"Potion"},
{id:373,data:8258,name:"Potion"},
{id:373,data:16386,name:"Potion"},
{id:373,data:16418,name:"Potion"},
{id:373,data:16450,name:"Potion"},
{id:373,data:8227,name:"Potion"},
{id:373,data:8259,name:"Potion"},
{id:373,data:16419,name:"Potion"},
{id:373,data:16451,name:"Potion"},
{id:373,data:8196,name:"Potion"},
{id:373,data:8228,name:"Potion"},
{id:373,data:8260,name:"Potion"},
{id:373,data:16388,name:"Potion"},
{id:373,data:16420,name:"Potion"},
{id:373,data:16452,name:"Potion"},
{id:373,data:8261,name:"Potion"},
{id:373,data:8229,name:"Potion"},
{id:373,data:16453,name:"Potion"},
{id:373,data:16421,name:"Potion"},
{id:373,data:8230,name:"Potion"},
{id:373,data:8262,name:"Potion"},
{id:373,data:16422,name:"Potion"},
{id:373,data:16454,name:"Potion"},
{id:373,data:8232,name:"Potion"},
{id:373,data:8264,name:"Potion"},
{id:373,data:16424,name:"Potion"},
{id:373,data:16456,name:"Potion"},
{id:373,data:8201,name:"Potion"},
{id:373,data:8233,name:"Potion"},
{id:373,data:8265,name:"Potion"},
{id:373,data:16393,name:"Potion"},
{id:373,data:16425,name:"Potion"},
{id:373,data:16457,name:"Potion"},
{id:373,data:8234,name:"Potion"},
{id:373,data:8266,name:"Potion"},
{id:373,data:16426,name:"Potion"},
{id:373,data:16458,name:"Potion"},
{id:373,data:8268,name:"Potion"},
{id:373,data:8236,name:"Potion"},
{id:373,data:16460,name:"Potion"},
{id:373,data:16428,name:"Potion"},
{id:373,data:8238,name:"Potion"},
{id:373,data:8270,name:"Potion"},
{id:373,data:16430,name:"Potion"},
{id:373,data:16462,name:"Potion"},
{id:374,data:0,name:"Glass Bottle"},
{id:375,data:0,name:"Spider Eye"},
{id:376,data:0,name:"Fermented Spider Eye"},
{id:377,data:0,name:"Blaze Powder"},
{id:378,data:0,name:"Magma Cream"},
{id:379,data:0,name:"Brewing Stand"},
{id:380,data:0,name:"Cauldron"},
{id:381,data:0,name:"Eye of Ender"},
{id:382,data:0,name:"Glistering Melon"},
{id:383,data:50,name:"Spawn"},
{id:383,data:51,name:"Spawn"},
{id:383,data:52,name:"Spawn"},
{id:383,data:54,name:"Spawn"},
{id:383,data:55,name:"Spawn"},
{id:383,data:56,name:"Spawn"},
{id:383,data:57,name:"Spawn"},
{id:383,data:58,name:"Spawn"},
{id:383,data:59,name:"Spawn"},
{id:383,data:60,name:"Spawn"},
{id:383,data:61,name:"Spawn"},
{id:383,data:62,name:"Spawn"},
{id:383,data:65,name:"Spawn"},
{id:383,data:66,name:"Spawn"},
{id:383,data:90,name:"Spawn"},
{id:383,data:91,name:"Spawn"},
{id:383,data:92,name:"Spawn"},
{id:383,data:93,name:"Spawn"},
{id:383,data:94,name:"Spawn"},
{id:383,data:95,name:"Spawn"},
{id:383,data:96,name:"Spawn"},
{id:383,data:98,name:"Spawn"},
{id:383,data:100,name:"Spawn"},
{id:383,data:120,name:"Spawn"},
{id:384,data:0,name:"Bottle o' Enchanting"},
{id:385,data:0,name:"Fire Charge"},
{id:386,data:0,name:"Book and Quill"},
{id:387,data:0,name:"Written Book"},
{id:388,data:0,name:"Emerald"},
{id:389,data:0,name:"Item Frame"},
{id:390,data:0,name:"Flower Pot"},
{id:391,data:0,name:"Carrot"},
{id:392,data:0,name:"Potato"},
{id:393,data:0,name:"Baked Potato"},
{id:394,data:0,name:"Poisonous Potato"},
{id:395,data:0,name:"Empty Map"},
{id:396,data:0,name:"Golden Carrot"},
{id:397,data:0,name:"Skeleton Skull"},
{id:397,data:1,name:"Wither Skeleton Skull"},
{id:397,data:2,name:"Zombie Head"},
{id:397,data:3,name:"Head"},
{id:397,data:4,name:"Creeper Head"},
{id:398,data:0,name:"Carrot on a Stick"},
{id:399,data:0,name:"Nether Star"},
{id:400,data:0,name:"Pumpkin Pie"},
{id:401,data:0,name:"Firework Rocket"},
{id:402,data:0,name:"Firework Star"},
{id:403,data:0,name:"Enchanted Book"},
{id:404,data:0,name:"Redstone Comparator"},
{id:405,data:0,name:"Nether Brick"},
{id:406,data:0,name:"Nether Quartz"},
{id:407,data:0,name:"Minecart with TNT"},
{id:408,data:0,name:"Minecart with Hopper"},
{id:417,data:0,name:"Iron Horse Armor"},
{id:418,data:0,name:"Gold Horse Armor"},
{id:419,data:0,name:"Diamond Horse Armor"},
{id:420,data:0,name:"Lead"},
{id:421,data:0,name:"Name Tag"},
{id:2256,data:0,name:"Music Disc"},
{id:2257,data:0,name:"Music Disc"},
{id:2258,data:0,name:"Music Disc"},
{id:2259,data:0,name:"Music Disc"},
{id:2260,data:0,name:"Music Disc"},
{id:2261,data:0,name:"Music Disc"},
{id:2262,data:0,name:"Music Disc"},
{id:2263,data:0,name:"Music Disc"},
{id:2264,data:0,name:"Music Disc"},
{id:2265,data:0,name:"Music Disc"},
{id:2266,data:0,name:"Music Disc"},
{id:2267,data:0,name:"Music Disc"},
{id:174,data:0,name:"Packed Ice"},
{id:175,data:0,name:"Sunflower"},
{id:175,data:1,name:"Lilac"},
{id:175,data:2,name:"Double Tall Grass"},
{id:175,data:3,name:"Large Fern"},
{id:175,data:4,name:"RoseBush"},
{id:175,data:5,name:"Peony"}
];

/**ENTITIES**/
entities = [
	'Passive Mobs',
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
	'Neutral Mobs',
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
	'Aggressive Mobs',
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
	'Utility Mobs',
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
	'Boss Mobs',
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
	'Projectiles',
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
	'Minecarts',
	{
		id: 'MinecartRidable',
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
	'Other',
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

/**MCCOMMANDS**/
var mcCommands = {
	'commands': commands,
	'params': params,
	'tags': tags,
	'structures': structures,
	'items': items,
	'blocks': blocks,
	'entities': entities,
	'sounds': sounds,
	'selectors': selectors,
	'create': createSelector
};
window['mcCommands'] = mcCommands;

})(document,window);
