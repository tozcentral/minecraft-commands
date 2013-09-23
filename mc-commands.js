/**
	Process:

	Create param: Same with player selector
		new CommandSelector ( )
		CommandSelector.toHTML ( container )
			addEvent ( onchange, selector.onChange )
			new Command ( name )
			Command.toHTML ( container )
				addEvent ( onchange, command.onChange )
			Command.toString
		Command.toString

**/

function onRemoveClick ( e, parent )
{
	e = e || window.event;
	var target = e.target || e.srcElement;

	if ( e.preventDefault )
		e.preventDefault ( );

	var i;

	/*var table = target.parentNode;
	while ( table && table.className != 'mc-tag-options' )
	{
		table = table.parentNode;
	}

	if ( !table )
		return false;*/

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


var commands = {
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

function CommandSelector ( container, from )
{
	this.command = null;

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
		this.command = new GenericCommand ( options, command, this.command );
}

CommandSelector.prototype.createHTML = function ( container )
{
	container.className = 'mc-command';

	var selector = document.createElement ( 'select' );
	selector.className = 'mc-command-selector';
	selector.addEventListener ( 'change', ( function ( commandSelector ) { return function ( e ) { commandSelector.onSelectorChange ( e ) } } ) ( this ) );
	container.appendChild ( selector );

	/*var option = document.createElement ( 'option' );
	option.appendChild ( document.createTextNode ( 'Select Command' ) );
	selector.appendChild ( option );*/

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

Command.prototype.updateLoop = function ( )
{
	var nextHasValue = false;
	for ( var i = this.paramsOrdered.length - 1; i >= 0; i-- )
	{
		if ( !nextHasValue && this.paramsOrdered[i + 1] && ( this.paramsOrdered[i + 1].container.style.display === '' || this.paramsOrdered[i + 1].ignoreIfHidden === false ) )
			nextHasValue = ( this.paramsOrdered[i + 1].value.toString ( ) !== '' );

		if ( this.paramsOrdered[i].container.style.display === '' || this.paramsOrdered[i].ignoreIfHidden === false )
			this.paramsOrdered[i].value.update ( nextHasValue );
		else if ( this.paramsOrdered[i].value.setError )
			this.paramsOrdered[i].value.setError ( false );
	}

	/*for ( var param in this.params )
	{
		this.params[param].value.update ( );
	}*/
}

Command.prototype.update = function ( )
{
	this.updateLoop ( );
}

Command.prototype.toString = function ( )
{
	var values = [];

	var nextHasValue = false;
	for ( var i = this.paramsOrdered.length - 1; i >= 0; i-- )
	{
		if ( !nextHasValue && this.paramsOrdered[i + 1] && !this.paramsOrdered[i + 1].ignoreValue && ( this.paramsOrdered[i + 1].container.style.display === '' || this.paramsOrdered[i + 1].ignoreIfHidden === false ) )
			nextHasValue = ( this.paramsOrdered[i + 1].value.toString ( ) !== '' );

		if ( !this.paramsOrdered[i].ignoreValue && ( this.paramsOrdered[i].container.style.display === '' || this.paramsOrdered[i].ignoreIfHidden === false ))
		{
			value = this.paramsOrdered[i].value.toString ( nextHasValue );
			if ( value !== '' )
				values.unshift ( value );
		}
	}

	var output = '/' + this.name;

	values = values.join ( ' ' );

	if ( values !== '' )
		output += ' ' + values;

	return output;
}

Command.prototype.createParam = function ( container, name, Type, from, options )
{
	options = options || {};
	options.defaultValue = options.defaultValue === undefined ? undefined : options.defaultValue
	options.ignoreValue = options.ignoreValue === undefined ? false : options.ignoreValue
	options.ignoreIfHidden = options.ignoreIfHidden === undefined ? true : options.ignoreIfHidden
	options.optional = options.optional === undefined ? false : options.optional

	var row = document.createElement ( 'tr' );

	var cell = document.createElement ( 'th' );
	cell.appendChild ( document.createTextNode ( options.optional ? '[' + name + ']' : '<' + name + '>' ) );
	row.appendChild ( cell );

	cell = document.createElement ( 'td' );
	var value = new Type ( cell, options.defaultValue, options.optional, from && from[name] && from[name].value, options );
	row.appendChild ( cell );

	container.appendChild ( row );

	this.params[name] = {
		name: name,
		value: value,
		defaultValue: options.defaultValue,
		ignoreValue: options.ignoreValue,
		ignoreIfHidden: options.ignoreIfHidden,
		optional: options.optional,
		container: row
	}
	this.paramsOrdered.push ( this.params[name] );
}

function GenericCommand ( container, name, from )
{
	this.name = name;
	this.description = commands[name].description;
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.params;

	var params = commands[name].params;

	for ( var i = 0; i < params.length; i++ )
	{
		var param = params[i];

		this.createParam ( container, param.name, param.type || TextParam, from, {defaultValue: param.defaultValue || '', ignoreIfHidden: param.ignoreIfHidden || true, optinal: param.optinal || false} );
	}
}

GenericCommand.prototype = new Command ( );

function CommandAchievement ( container, from )
{
	this.name = 'achievement'
	this.description = '';
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.params;

	this.createParam ( container, 'give', StaticParam, from, { defaultValue: 'give' }  );
	this.createParam ( container, 'achievement or statistic', AchievementParam, from );
	this.createParam ( container, 'player', PlayerSelectorParam, from, { optional: true } );
}

CommandAchievement.prototype = new Command ( );

function CommandClear ( container, from )
{
	this.name = 'clear'
	this.description = '';
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.params;

	this.createParam ( container, 'player', PlayerSelectorParam, from, { optional: true } );
	this.createParam ( container, 'item metadata', ItemParam, from, { optional: true, ignoreValue: true } ); // New ItemParam, list of all items + custom
	this.createParam ( container, 'item', NumberParam, from, { optional: true, ignoreIfHidden: false, min: 1 } );
	this.createParam ( container, 'metadata', NumberParam, from, { optional: true, ignoreIfHidden: false, defaultValue: 0, min: 0 } );
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
/*
CommandClear.prototype.toString = function ( )
{
	var output = '/' + this.name;

	var value = ' ' + this.params.player.value;
	if ( value != ' ' )
		output += value;

	/*if ( this.params['item metadata'].value.value === '' )
	{* /
		var value = ' ' + this.params.item.value;
		if ( value != ' ' )
			output += value;

		var value = ' ' + this.params.metadata.value;
		if ( value != ' ' )
			output += value;
	/*}
	else
	{
		var value = ' ' + this.params['item metadata'].value;
		if ( value != ' ' )
			output += value;
	}* /

	return output;
}
*/
function CommandDebug ( container, from )
{
	this.name = 'debug'
	this.description = '';
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.params;

	this.createParam ( container, 'start | stop', ListParam, from, { items: ['start', 'stop'] } );
}

CommandDebug.prototype = new Command ( );

function CommandDefaultGamemode ( container, from )
{
	this.name = 'defaultgamemode'
	this.description = '';
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.params;

	this.createParam ( container, 'survival | creative | adventure', ListParam, from, { items: ['survival', 'creative', 'adventure'] } );
}

CommandDefaultGamemode.prototype = new Command ( );

function CommandDifficulty ( container, from )
{
	this.name = 'difficulty'
	this.description = '';
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.params;

	this.createParam ( container, 'peaceful | easy | normal | hard', ListParam, from, { items: ['peaceful', 'easy', 'normal', 'hard'] } );
}

CommandDifficulty.prototype = new Command ( );

function CommandEffect ( container, from )
{
	this.name = 'effect'
	this.description = '';
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.params;

	this.createParam ( container, 'player', PlayerSelectorParam, from );
	this.createParam ( container, 'effect', PotionParam, from );
	this.createParam ( container, 'seconds', NumberParam, from, { optional: true, ignoreIfHidden: true, min:0, max:1000000 } );
	this.createParam ( container, 'amplifier', NumberParam, from, { optional: true, ignoreIfHidden: true, min:0, max:255 } );
}

CommandEffect.prototype = new Command ( );

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
}

function CommandEnchant ( container, from )
{
	this.name = 'enchant'
	this.description = '';
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.params;

	this.createParam ( container, 'player', PlayerSelectorParam, from );
	this.createParam ( container, 'enchantment', EnchantmentParam, from );
	this.createParam ( container, 'level', NumberParam, from, { optional: true, min:1, max:5 } );
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

	/*for ( var param in this.params )
	{
		this.params[param].value.update ( );
	}*/
}

function CommandGamemode ( container, from )
{
	this.name = 'gamemode'
	this.description = '';
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.params;

	this.createParam ( container, 'survival | creative | adventure', ListParam, from, { items: ['survival', 'creative', 'adventure'] } );
	this.createParam ( container, 'player', PlayerSelectorParam, from, { optional: true } );
}

CommandGamemode.prototype = new Command ( );

function CommandGameRule ( container, from )
{
	this.name = 'gamerule'
	this.description = '';
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.params;

	this.createParam ( container, 'rulename', ListParam, from, { items: ['commandBlockOutput', 'doFireTick', 'doMobLoot', 'doMobSpawning', 'doTileDrops', 'keepInventory', 'mobGriefing', 'naturalRegeneration', 'doDaylightCycle'] } );
	this.createParam ( container, 'true | false', ListParam, from, { items: ['true', 'false'] } );
}

CommandGameRule.prototype = new Command ( );

function CommandGive ( container, from )
{
	this.name = 'give'
	this.description = '';
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.params;

	this.createParam ( container, 'player', PlayerSelectorParam, from );
	this.createParam ( container, 'item metadata', ItemParam, from, { ignoreValue: true } ); // New ItemParam, list of all items + custom
	this.createParam ( container, 'item', NumberParam, from, { ignoreIfHidden: false, min:1 } );
	this.createParam ( container, 'amount', NumberParam, from, { optional: true, min: 0, max: 64 } );
	this.createParam ( container, 'metadata', NumberParam, from, { optional: true, ignoreIfHidden: false, defaultValue: 0, min: 0, max: 15 } );
	this.createParam ( container, 'dataTag', DataTagParam, from, { optional: true, type: 'ItemGeneric' } );
}

CommandGive.prototype = new Command ( );

CommandGive.prototype.update = function ( )
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
/*
CommandGive.prototype.toString = function ( )
{
	var output = '/' + this.name;

	var value = ' ' + this.params.player.value;
	if ( value != ' ' )
		output += value;

	var dataTag = this.params['dataTag'].value.toString ( );

	/*if ( this.params['item metadata'].value.value === '' )
	{* /
		var value = ' ' + this.params.item.value;
		if ( value != ' ' )
			output += value;

		var value = ' ' + this.params['amount'].value;
		if ( value != ' ' )
			output += value;

		var value = ' ' + this.params.metadata.value;
		if ( value != ' ' )
			output += value;
	/*}
	else
	{
		var itemMetadata = this.params['item metadata'].value.value;

		var value = ' ' + itemMetadata[0];
		if ( value != ' ' )
			output += value;

		var value = ' ' + this.params['amount'].value;
		if ( value != ' ' )
			output += value;

		if ( ( parseInt ( itemMetadata[1] ) || 0 ) != 0 || dataTag )
		{
			var value = ' ' + ( itemMetadata[1] || 0 );
			if ( value != ' ' )
				output += value;
		}
	}* /

	var value = ' ' + dataTag;
	if ( value != ' ' )
		output += value;

	return output;
}*/

function CommandMe ( container, from )
{
	this.name = 'me'
	this.description = '';
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.params;

	this.createParam ( container, 'actiontext', TextParam, '', true, false, from );
}

CommandMe.prototype = new Command ( );

function CommandPlaySound ( container, from )
{
	this.name = 'playsound'
	this.description = '';
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.params;

	this.createParam ( container, 'sound', SoundParam, from );
	this.createParam ( container, 'player', PlayerSelectorParam, from );
	this.createParam ( container, 'x', PosParam, from, { optional: true } );
	this.createParam ( container, 'y', PosParam, from, { optional: true, height: true } );
	this.createParam ( container, 'z', PosParam, from, { optional: true } );
	this.createParam ( container, 'volume', NumberParam, from, { optional: true, min:0.0, isFloat:true } );
	this.createParam ( container, 'pitch', NumberParam, from, { optional: true, min:0.0, max:2.0, isFloat:true } );
	this.createParam ( container, 'minimumVolume', NumberParam, from, { optional: true, min:0.0, max:1.0, isFloat:true } );
}

CommandPlaySound.prototype = new Command ( );

function CommandSay ( container, from )
{
	this.name = 'say'
	this.description = '';
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.params;

	this.createParam ( container, 'message', TextParam, '', true, false, from );
}

CommandSay.prototype = new Command ( );

function CommandScoreBoard ( container, from )
{
	this.name = 'scoreboard'
	this.description = '';
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.params;

	this.createParam ( container, 'objectives | players | teams', ListParam, from, { items: ['objectives','players','teams'] } );
	this.createParam ( container, 'objectives', ScoreboardObjectivesParam, from );
	this.createParam ( container, 'players', ScoreboardPlayersParam, from );
	this.createParam ( container, 'teams', ScoreboardTeamsParam, from );
	/*this.createParam ( container, 'list | add | remove | setdisplay', ListParam, from, { items: ['list','add','remove','setdisplay'] } );
	this.createParam ( container, 'set | add | remove | reset | list', ListParam, from, { items: ['set','add','remove','reset','list'] } );
	this.createParam ( container, 'list | add | remove | empty | join | leave | option', ListParam, from, { items: ['list','add','remove','empty','join','leave','option'] } );*/
}

CommandScoreBoard.prototype = new Command ( );

function CommandSetBlock ( container, from )
{
	this.name = 'setblock'
	this.description = '';
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.params;

	this.createParam ( container, 'x', PosParam, from );
	this.createParam ( container, 'y', PosParam, from, { height: true } );
	this.createParam ( container, 'z', PosParam, from );
	this.createParam ( container, 'tilename datavalue', BlockParam, from, { ignoreValue: true } );
	this.createParam ( container, 'tilename', TextParam, from, { ignoreIfHidden: false } );
	this.createParam ( container, 'datavalue', NumberParam, from, { optional: true, ignoreIfHidden: false, defaultValue: 0, min:0, max:15 } );
	this.createParam ( container, 'oldblockHandling', ListParam, from, { optional: true, items: ['', 'replace','keep','destory'] } );
	this.createParam ( container, 'dataTag', DataTagParam, from, { optional: true, type: 'BlockGeneric' } );
}

CommandSetBlock.prototype = new Command ( );

CommandSetBlock.prototype.update = function ( )
{
	if ( this.params['tilename datavalue'].value.value !== 'custom' )
	{
		var itemMetadata = this.params['tilename datavalue'].value.value.split ( ' ' );

		this.params.tilename.value.setValue ( itemMetadata[0] || '' );
		this.params.datavalue.value.setValue ( itemMetadata[1] || '' );
	}

	if ( this.params['tilename datavalue'].value.value == 'custom' )
	{
		this.params.tilename.container.style.display = '';
		this.params.datavalue.container.style.display = '';
	}
	else
	{
		this.params.tilename.container.style.display = 'none';
		this.params.datavalue.container.style.display = 'none';
	}

	this.updateLoop ( );
}

function CommandSpawnPoint ( container, from )
{
	this.name = 'spawnpoint'
	this.description = '';
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.params;

	this.createParam ( container, 'player', PlayerSelectorParam, from, { optional: true } );
	this.createParam ( container, 'x', PosParam, from, { optional: true } );
	this.createParam ( container, 'y', PosParam, from, { optional: true, height: true } );
	this.createParam ( container, 'z', PosParam, from, { optional: true } );
}

CommandSpawnPoint.prototype = new Command ( );

function CommandSpreadPlayers ( container, from )
{
	this.name = 'spreadplayers'
	this.description = '';
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.params;

	this.createParam ( container, 'x', PosParam, from );
	this.createParam ( container, 'z', PosParam, from );
	this.createParam ( container, 'spreadDistance', NumberParam, from, {isFloat:true} );
	this.createParam ( container, 'maxRange', NumberParam, from );
	this.createParam ( container, 'respectTeams', ListParam, from, { items: ['true','false'] } );
	//this.createParam ( container, 'player', PlayerListParam, from );
}

CommandSpreadPlayers.prototype = new Command ( );

function CommandSummon ( container, from )
{
	this.name = 'summon'
	this.description = '';
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.params;

	/*this.createParam ( container, 'EntityName', EntityParam, '', true, false, from );
	this.createParam ( container, 'x', PosParam, '', true, false, from );
	this.createParam ( container, 'y', PosParam, '', true, false, from, true );
	this.createParam ( container, 'z', PosParam, '', true, false, from );
	this.createParam ( container, 'dataTag', DataTagParam, '', true, true, from, 'entitiy' );*/
}

CommandSummon.prototype = new Command ( );

function CommandTell ( container, from )
{
	this.name = 'tell'
	this.description = '';
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.params;

	this.createParam ( container, 'player', PlayerSelectorParam, from );
	this.createParam ( container, 'message', TextParam, from );
}

CommandTell.prototype = new Command ( );

function CommandTellRaw ( container, from )
{
	this.name = 'tellraw'
	this.description = '';
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.params;

	/*this.createParam ( container, 'player', PlayerSelectorParam, '', true, false, from );
	this.createParam ( container, 'rawmessage', RawMessageParam, '', true, false, from );*/
}

CommandTellRaw.prototype = new Command ( );

function CommandTestFor ( container, from )
{
	this.name = 'testfor'
	this.description = '';
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.params;

	this.createParam ( container, 'player', PlayerSelectorParam, from );
}

CommandTestFor.prototype = new Command ( );

function CommandTestForBlock ( container, from )
{
	this.name = 'testforblock'
	this.description = '';
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.params;

	this.createParam ( container, 'x', PosParam, from );
	this.createParam ( container, 'y', PosParam, from, { height: true } );
	this.createParam ( container, 'z', PosParam, from );
	this.createParam ( container, 'tilename datavalue', BlockParam, from, { ignoreValue: true } );
	this.createParam ( container, 'tilename', TextParam, from, { ignoreIfHidden: false } );
	this.createParam ( container, 'datavalue', NumberParam, from, { optional: true, ignoreIfHidden: false, defaultValue: 0, min:0, max:15 } );
	this.createParam ( container, 'dataTag', DataTagParam, from, { optional: true, type: 'BlockGeneric' } );
}

CommandTestForBlock.prototype = new Command ( );

CommandTestForBlock.prototype.update = function ( )
{
	if ( this.params['tilename datavalue'].value.value !== 'custom' )
	{
		var itemMetadata = this.params['tilename datavalue'].value.value.split ( ' ' );

		this.params.tilename.value.setValue ( itemMetadata[0] || '' );
		this.params.datavalue.value.setValue ( itemMetadata[1] || '' );
	}

	if ( this.params['tilename datavalue'].value.value == 'custom' )
	{
		this.params.tilename.container.style.display = '';
		this.params.datavalue.container.style.display = '';
	}
	else
	{
		this.params.tilename.container.style.display = 'none';
		this.params.datavalue.container.style.display = 'none';
	}

	this.updateLoop ( );
}

function CommandTime ( container, from )
{
	this.name = 'time'
	this.description = '';
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.params;

	this.createParam ( container, 'set | add', ListParam, from, { items: ['set','add'] } );
	this.createParam ( container, 'number', NumberParam, from ); // Add day/night
}

CommandTime.prototype = new Command ( );

function CommandToggleDownFall ( container, from )
{
	this.name = 'toggledownfall'
	this.description = '';
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.params;
}

CommandToggleDownFall.prototype = new Command ( );

function CommandTP ( container, from )
{
	this.name = 'effect'
	this.description = '';
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.params;

	this.createParam ( container, 'player', PlayerSelectorParam, '', true, false, from );
}

CommandTP.prototype = new Command ( );

function CommandWeather ( container, from )
{
	this.name = 'weather'
	this.description = '';
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.params;

	this.createParam ( container, 'clear | rain | thunder', ListParam, from, { items: ['clear','rain','thunder'] } );
	this.createParam ( container, 'seconds', NumberParam, from, { optional: true, min:1, max:1000000 } );
}

CommandWeather.prototype = new Command ( );

function CommandXP ( container, from )
{
	this.name = 'xp'
	this.description = '';
	this.params = {};
	this.paramsOrdered = [];

	from = from && from.params;

	this.createParam ( container, 'amount', XPParam, from );
	this.createParam ( container, 'player', PlayerSelectorParam, from, { optional: true } );
}

CommandXP.prototype = new Command ( );

function Param ( )
{
	this.value = '';
}

Param.prototype = new Command ( );

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
}

Param.prototype.toString = function ( needValue )
{
	var value = this.value;
	if ( value === '' && needValue && this.input && this.input.placeholder )
	{
		value = this.input.placeholder;
	}
	return value;
}

Param.prototype.setError = function ( error )
{
	if ( error )
		this.input.className = 'error'
	else
		this.input.className = ''
}

Param.prototype.update = function ( nextHasValue )
{
}

function AchievementParam ( container, defaultValue, optional, from, options )
{
	var optgroup, option, i;
	
	this.optional = optional;
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

	this.value = from && from.value;

	var select = document.createElement ( 'select' )
	select.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onValueChange ( e ) } } ) ( this ) );

	optgroup = document.createElement ( 'optgroup' )
	optgroup.label = 'Achievements';
	select.appendChild ( optgroup );

	for ( i in achievements )
	{
		option = document.createElement ( 'option' );
		option.selected = ( achievements[i] == ( this.value || options.defaultValue ) )
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
		option.selected = ( stats[i] == ( this.value || options.defaultValue ) )
		option.value = 'stat.' + i;
		option.appendChild ( document.createTextNode ( stats[i] ) );
		optgroup.appendChild ( option );
	}

	this.value = select.value;

	container.appendChild ( select );
}

AchievementParam.prototype = new Param ( );

function BlockParam ( container, defaultValue, optional, from, options )
{
	var option;
	
	this.optional = optional;
	var blocks = {
		'minecraft:stone 0': 'Stone',
		'minecraft:grass 0': 'Grass Block',
		'minecraft:dirt 0': 'Dirt',
		'minecraft:dirt 2': 'Podzol',
		'minecraft:cobblestone 0': 'Cobblestone',
		'minecraft:planks 0': 'Oak Wood Planks',
		'minecraft:planks 1': 'Spruce Wood Planks',
		'minecraft:planks 2': 'Birch Wood Planks',
		'minecraft:planks 3': 'Jungle Wood Planks',
		'minecraft:sapling 0': 'Oak Sapling',
		'minecraft:sapling 1': 'Spruce Sapling',
		'minecraft:sapling 2': 'Birch Sapling',
		'minecraft:sapling 3': 'Jungle Sapling',
		'minecraft:bedrock 0': 'Bedrock',
		'minecraft:water 0': 'Water',
		'minecraft:lava 0': 'Lava',
		'minecraft:sand 0': 'Sand'
		/*'13 0': 'Gravel',
		'14 0': 'Gold Ore',
		'15 0': 'Iron Ore',
		'16 0': 'Coal Ore',
		'17 0': 'Oak Wood',
		'17 1': 'Spruce Wood',
		'17 2': 'Birch Wood',
		'17 3': 'Jungle Wood',
		'18 0': 'Oak Leaves',
		'18 1': 'Spruce Leaves',
		'18 2': 'Birch Leaves',
		'18 3': 'Jungle Leaves',
		'19 0': 'Sponge',
		'20 0': 'Glass Block',
		'21 0': 'Lapis Lazuli Ore',
		'22 0': 'Lapis Lazuli Block',
		'23 0': 'Dispenser',
		'24 0': 'Sandstone',
		'24 1': 'Chiselled Sandstone',
		'24 2': 'Smooth Sandstone',
		'25 0': 'Note Block',
		//'26 0': 'Block',
		'27 0': 'Powered Rail',
		'28 0': 'Detector Rail',
		'29 0': 'Sticky Piston',
		'30 0': 'Cobweb',
		'31 0': 'Shrub',
		'31 1': 'Grass',
		'31 2': 'Fern',
		'32 0': 'Dead Bush',
		'33 0': 'Piston',
		//'34 0': 'Block',
		'35 0': 'Wool',
		'35 1': 'Orange Wool',
		'35 2': 'Magenta Wool',
		'35 3': 'Light Blue Wool',
		'35 4': 'Yellow Wool',
		'35 5': 'Light Green Wool',
		'35 6': 'Pink Wool',
		'35 7': 'Grey Wool',
		'35 8': 'Light Grey Wool',
		'35 9': 'Cyan Wool',
		'35 10': 'Purple Wool',
		'35 11': 'Blue Wool',
		'35 12': 'Brown Wool',
		'35 13': 'Green Wool',
		'35 14': 'Red Wool',
		'35 15': 'Black Wool',
		//'36 0': 'Block',
		'37 0': 'Dandelion',
		'38 0': 'Poppy',
		'38 1': 'Blue Orchid',
		'38 2': 'Allium',
		'38 3': 'Azure Bluet',
		'38 4': 'Red Tulip',
		'38 5': 'Orange Tulip',
		'38 6': 'White Tulip',
		'38 7': 'Pink Tulip',
		'38 8': 'Oxeye Daisy',
		'39 0': 'Brown Mushroom',
		'40 0': 'Red Mushroom',
		'41 0': 'Gold Block',
		'42 0': 'Iron Block',
		'43 0': 'Stone Double Slab',
		'43 1': 'Sandstone Double Slab',
		'43 2': 'Fireproof Wooden Double Slab',
		'43 3': 'Cobblestone Double Slab',
		'43 4': 'Brick Double Slab',
		'43 5': 'Stone Brick Double Slab',
		'43 6': 'Nether Brick Double Slab',
		'43 7': 'Quartz Double Slab',
		'43 8': 'Clean Stone Double Slab',
		'43 9': 'Clean Sandstone Double Slab',
		'43 10': 'Clean Fireproof Wooden Double Slab',
		'43 11': 'Clean Cobblestone Double Slab',
		'43 12': 'Clean Brick Double Slab',
		'43 13': 'Clean Stone Brick Double Slab',
		'43 14': 'Clean Nether Brick Double Slab',
		'43 15': 'Clean Quartz Double Slab',
		'44 0': 'Stone Slab',
		'44 1': 'Sandstone Slab',
		'44 2': 'Fireproof Wooden Slab',
		'44 3': 'Cobblestone Slab',
		'44 4': 'Brick Slab',
		'44 5': 'Stone Brick Slab',
		'44 6': 'Nether Brick Slab',
		'44 7': 'Quartz Slab',
		'45 0': 'Bricks',
		'46 0': 'TNT',
		'47 0': 'Bookshelf',
		'48 0': 'Mossy Cobblestone',
		'49 0': 'Obsidian',*/
	};

	this.value = from && from.value;

	var select = document.createElement ( 'select' )
	select.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onValueChange ( e ) } } ) ( this ) );

	if ( optional )
	{
		option = document.createElement ( 'option' );
		option.value = '';
		option.appendChild ( document.createTextNode ( 'None' ) );
		select.appendChild ( option );
	}

	for ( var i in blocks )
	{
		option = document.createElement ( 'option' );
		option.selected = ( blocks[i] == ( this.value || options.defaultValue ) )
		option.value = i;
		option.appendChild ( document.createTextNode ( blocks[i] ) );
		select.appendChild ( option );
	}

	option = document.createElement ( 'option' );
	option.value = 'custom';
	option.appendChild ( document.createTextNode ( 'Custom' ) );
	select.appendChild ( option );

	this.value = select.value;

	container.appendChild ( select );
}

BlockParam.prototype = new Param ( );

function DataTagParam ( container, defaultValue, optional, from, options )
{
	this.tag = null;
	this.optional = optional;

	this.createHTML ( container, ( options && options.selector ) || false );

	this.tag = from && from.tag;

	if ( this.selector )
		this.updateType ( this.selector.value );
	else if ( options && options.type )
		this.updateType ( options.type );
}

DataTagParam.prototype = new Param ( );

DataTagParam.prototype.createHTML = function ( container, showSelector )
{
	container.className = 'mc-tag';

	if ( showSelector )
	{
		var option;
		
		var selector = document.createElement ( 'select' );
		selector.className = 'mc-player-selector';
		selector.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onSelectorChange ( e ) } } ) ( this ) );
		container.appendChild ( selector );

		if ( this.optional )
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

DataTagParam.prototype.updateType = function ( type )
{
	var options = this.options;

	options.innerHTML = '';

	if ( this.selector )
		this.selector.value = type;

	this.tag = new window[('Tag' + type)] ( options, this.tag );
}

DataTagParam.prototype.update = function ( nextHasValue )
{
	if ( this.tag )
		this.tag.update ( );
}

DataTagParam.prototype.toString = function ( )
{
	return this.tag ? this.tag.toString ( ) : '';
}

function EnchantmentParam ( container, defaultValue, optional, from, options )
{
	var option;
	
	this.optional = optional;
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

	if ( optional )
	{
		option = document.createElement ( 'option' );
		option.value = '';
		option.appendChild ( document.createTextNode ( 'None' ) );
		select.appendChild ( option );
	}

	for ( var i in enchantments )
	{
		option = document.createElement ( 'option' );
		option.selected = ( enchantments[i] == ( this.value || options.defaultValue ) )
		option.value = i;
		option.appendChild ( document.createTextNode ( enchantments[i] ) );
		select.appendChild ( option );
	}

	this.value = select.value;

	container.appendChild ( select );
}

EnchantmentParam.prototype = new Param ( );

function ItemParam ( container, defaultValue, optional, from, options )
{
	var option;
	
	this.optional = optional;
	var items = {
		'1 0': 'Stone',
		'2 0': 'Grass Block',
		'3 0': 'Dirt',
		'3 2': 'Podzol',
		'4 0': 'Cobblestone',
		'5 0': 'Oak Wood Planks',
		'5 1': 'Spruce Wood Planks',
		'5 2': 'Birch Wood Planks',
		'5 3': 'Jungle Wood Planks',
		'6 0': 'Oak Sapling',
		'6 1': 'Spruce Sapling',
		'6 2': 'Birch Sapling',
		'6 3': 'Jungle Sapling',
		'7 0': 'Bedrock',
		'8 0': 'Water',
		'9 0': 'Water',
		'10 0': 'Lava',
		'11 0': 'Lava',
		'12 0': 'Sand',
		'13 0': 'Gravel',
		'14 0': 'Gold Ore',
		'15 0': 'Iron Ore',
		'16 0': 'Coal Ore',
		'17 0': 'Oak Wood',
		'17 1': 'Spruce Wood',
		'17 2': 'Birch Wood',
		'17 3': 'Jungle Wood',
		'18 0': 'Oak Leaves',
		'18 1': 'Spruce Leaves',
		'18 2': 'Birch Leaves',
		'18 3': 'Jungle Leaves',
		'19 0': 'Sponge',
		'20 0': 'Glass Block',
		'21 0': 'Lapis Lazuli Ore',
		'22 0': 'Lapis Lazuli Block',
		'23 0': 'Dispenser',
		'24 0': 'Sandstone',
		'24 1': 'Chiselled Sandstone',
		'24 2': 'Smooth Sandstone',
		'25 0': 'Note Block',
		//'26 0': 'Block',
		'27 0': 'Powered Rail',
		'28 0': 'Detector Rail',
		'29 0': 'Sticky Piston',
		'30 0': 'Cobweb',
		'31 0': 'Shrub',
		'31 1': 'Grass',
		'31 2': 'Fern',
		'32 0': 'Dead Bush',
		'33 0': 'Piston',
		//'34 0': 'Block',
		'35 0': 'Wool',
		'35 1': 'Orange Wool',
		'35 2': 'Magenta Wool',
		'35 3': 'Light Blue Wool',
		'35 4': 'Yellow Wool',
		'35 5': 'Light Green Wool',
		'35 6': 'Pink Wool',
		'35 7': 'Grey Wool',
		'35 8': 'Light Grey Wool',
		'35 9': 'Cyan Wool',
		'35 10': 'Purple Wool',
		'35 11': 'Blue Wool',
		'35 12': 'Brown Wool',
		'35 13': 'Green Wool',
		'35 14': 'Red Wool',
		'35 15': 'Black Wool',
		//'36 0': 'Block',
		'37 0': 'Dandelion',
		'38 0': 'Poppy',
		'38 1': 'Blue Orchid',
		'38 2': 'Allium',
		'38 3': 'Azure Bluet',
		'38 4': 'Red Tulip',
		'38 5': 'Orange Tulip',
		'38 6': 'White Tulip',
		'38 7': 'Pink Tulip',
		'38 8': 'Oxeye Daisy',
		'39 0': 'Brown Mushroom',
		'40 0': 'Red Mushroom',
		'41 0': 'Gold Block',
		'42 0': 'Iron Block',
		'43 0': 'Stone Double Slab',
		'43 1': 'Sandstone Double Slab',
		'43 2': 'Fireproof Wooden Double Slab',
		'43 3': 'Cobblestone Double Slab',
		'43 4': 'Brick Double Slab',
		'43 5': 'Stone Brick Double Slab',
		'43 6': 'Nether Brick Double Slab',
		'43 7': 'Quartz Double Slab',
		'43 8': 'Clean Stone Double Slab',
		'43 9': 'Clean Sandstone Double Slab',
		'43 10': 'Clean Fireproof Wooden Double Slab',
		'43 11': 'Clean Cobblestone Double Slab',
		'43 12': 'Clean Brick Double Slab',
		'43 13': 'Clean Stone Brick Double Slab',
		'43 14': 'Clean Nether Brick Double Slab',
		'43 15': 'Clean Quartz Double Slab',
		'44 0': 'Stone Slab',
		'44 1': 'Sandstone Slab',
		'44 2': 'Fireproof Wooden Slab',
		'44 3': 'Cobblestone Slab',
		'44 4': 'Brick Slab',
		'44 5': 'Stone Brick Slab',
		'44 6': 'Nether Brick Slab',
		'44 7': 'Quartz Slab',
		'45 0': 'Bricks',
		'46 0': 'TNT',
		'47 0': 'Bookshelf',
		'48 0': 'Mossy Cobblestone',
		'49 0': 'Obsidian'
	};

	this.value = from && from.value;

	var select = document.createElement ( 'select' )
	select.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onValueChange ( e ) } } ) ( this ) );

	if ( optional )
	{
		option = document.createElement ( 'option' );
		option.value = '';
		option.appendChild ( document.createTextNode ( 'None' ) );
		select.appendChild ( option );
	}

	for ( var i in items )
	{
		option = document.createElement ( 'option' );
		option.selected = ( items[i] == ( this.value || options.defaultValue ) )
		option.value = i;
		option.appendChild ( document.createTextNode ( items[i] ) );
		select.appendChild ( option );
	}

	option = document.createElement ( 'option' );
	option.value = '0';
	option.appendChild ( document.createTextNode ( 'Custom' ) );
	select.appendChild ( option );

	this.value = select.value;

	container.appendChild ( select );
}

ItemParam.prototype = new Param ( );

function ListParam ( container, defaultValue, optional, from, options )
{
	var option;
	
	this.optional = optional;
	this.options = options;

	this.value = from && from.value;

	var select = document.createElement ( 'select' )
	select.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onValueChange ( e ) } } ) ( this ) );

	for ( var i = 0; i < options.items.length; i++ )
	{
		option = document.createElement ( 'option' );
		option.selected = ( options.items[i] == ( this.value || options.defaultValue ) )
		option.appendChild ( document.createTextNode ( options.items[i] ) );
		select.appendChild ( option );
	}

	this.value = select.value;
	this.input = select;

	container.appendChild ( select );
}

ListParam.prototype = new Param ( );

ListParam.prototype.update = function ( nextHasValue )
{
	this.setError ( false );

	var required = !this.optional || nextHasValue || false;

	if ( required && this.value === '' )
		this.setError ( true );
}

function PlayerSelectorParam ( container, defaultValue, optional, from )
{
	this.player = null;
	this.optional = optional;

	this.createHTML ( container );

	this.player = from && from.player;
	var selectorValue = from && from.selector && from.selector.value || this.selector.value;

	this.updatePlayer ( selectorValue );
}

PlayerSelectorParam.prototype = new Param ( );

PlayerSelectorParam.prototype.createHTML = function ( container )
{
	container.className = 'mc-player';

	var selector = document.createElement ( 'select' );
	selector.className = 'mc-player-selector';
	selector.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onSelectorChange ( e ) } } ) ( this ) );
	container.appendChild ( selector );

	if ( this.optional )
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

	var options = document.createElement ( 'table' );
	options.className = 'mc-player-options';
	container.appendChild ( options );

	this.selector = selector;
	this.options = options;
}

PlayerSelectorParam.prototype.onSelectorChange = function ( e )
{
	e = e || window.event;
	var target = e.target || e.srcElement;

	var player = target.value;

	if ( !player )
		return;

	var container = target.parentNode;

	this.updatePlayer ( player );

	updateCommand ( );
}

PlayerSelectorParam.prototype.updatePlayer = function ( player )
{
	var options = this.options;

	options.innerHTML = '';

	this.selector.value = player;

	switch ( player )
	{
		case 'None':
			this.player = null;
		break;
		case 'Username':
			this.player = new PlayerUsername ( options, false, this.player );
		break;
		default:
			this.player = new PlayerSelector ( options, player, this.optional, this.player );
	}
}

PlayerSelectorParam.prototype.update = function ( nextHasValue )
{
	this.selector.className = 'mc-player-selector';

	if ( this.player )
		this.player.update ( nextHasValue );
	else if ( nextHasValue )
		this.selector.className = 'mc-player-selector error';

}

PlayerSelectorParam.prototype.toString = function ( )
{
	return this.player ? this.player.toString ( ) : '';
}

function PosParam ( container, defaultValue, optional, from, options )
{
	this.isRelative = from && from.isRelative ? from.isRelative : false;
	this.value = from && from.value ? from.value : '';
	this.optional = optional;
	this.options = options;

	var input = document.createElement ( 'input' );
	input.type = 'checkbox'
	input.checked = this.isRelative;
	input.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onCheckChange ( e ) } } ) ( this ) );
	container.appendChild ( input );
	container.appendChild ( document.createTextNode ( ' Relative ' ) );

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

PosParam.prototype = new Param ( );

PosParam.prototype.onCheckChange = function ( e )
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

	updateCommand ( );
}

PosParam.prototype.update = function ( nextHasValue )
{
	this.setError ( false );

	var required = !this.optional || nextHasValue || false;

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

PosParam.prototype.toString = function ( )
{
	return ( this.isRelative ? '~' : '' ) + this.value;
}

function PotionParam ( container, defaultValue, optional, from, options )
{
	this.optional = optional;
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
	option.value = 0;
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

PotionParam.prototype = new Param ( );

function RawMessageParam ( container, defaultValue, optional, from )
{

}

RawMessageParam.prototype = new Param ( );

function ScoreboardObjectivesParam ( container, defaultValue, optional, from, options )
{
	var options = document.createElement ( 'table' );
	options.className = 'mc-scoreboard-options';
	container.appendChild ( options );

	this.createParam ( container, 'list | add | remove | setdisplay', ListParam, from, { items: ['list','add','remove','setdisplay'] } );
}

ScoreboardObjectivesParam.prototype = new Param ( );

function ScoreboardPlayersParam ( container, defaultValue, optional, from, options )
{
	var options = document.createElement ( 'table' );
	options.className = 'mc-scoreboard-options';
	container.appendChild ( options );

	this.createParam ( container, 'set | add | remove | reset | list', ListParam, from, { items: ['set','add','remove','reset','list'] } );
}

ScoreboardPlayersParam.prototype = new Param ( );

function ScoreboardTeamsParam ( container, defaultValue, optional, from, options )
{
	var options = document.createElement ( 'table' );
	options.className = 'mc-scoreboard-options';
	container.appendChild ( options );

	this.createParam ( container, 'list | add | remove | empty | join | leave | option', ListParam, from, { items: ['list','add','remove','empty','join','leave','option'] } );
}

ScoreboardTeamsParam.prototype = new Param ( );

function StaticParam ( container, defaultValue, optional, from, options )
{
	this.value = options.defaultValue;

	container.appendChild ( document.createTextNode ( options.defaultValue ) );
}

StaticParam.prototype = new Param ( );

function TextParam ( container, defaultValue, optional, from, options )
{
	this.value = from && from.value ? from.value : '';
	this.optional = optional;

	var input = document.createElement ( 'input' );
	if ( options && options.defaultValue !== undefined )
		input.placeholder = options.defaultValue;
	input.value = this.value;
	input.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onValueChange ( e ) } } ) ( this ) );
	container.appendChild ( input );

	this.input = input;
}

TextParam.prototype = new Param ( );

TextParam.prototype.update = function ( nextHasValue )
{
	var required = !this.optional || nextHasValue || false;

	if ( required )
		this.input.className = this.value === '' ? 'error' : '';
}

SoundParam = TextParam;

function NumberParam ( container, defaultValue, optional, from, options )
{
	this.value = from && from.value ? from.value : '';
	this.optional = optional;
	this.options = options;

	var input = document.createElement ( 'input' );
	if ( options && options.isRange )
		input.type = 'number'
	else
		input.type = 'number'
	if ( options && options.min )
		input.min = options.min;
	if ( options && options.max )
		input.max = options.max;
	if ( options && options.isFloat )
		input.step = 0.1;
	if ( options && options.defaultValue !== undefined )
		input.placeholder = options.defaultValue;
	input.value = this.value;
	input.addEventListener ( 'change', ( function ( param ) { return function ( e ) { param.onValueChange ( e ) } } ) ( this ) );
	container.appendChild ( input );

	this.input = input;
}

NumberParam.prototype = new Param ( );

NumberParam.prototype.update = function ( nextHasValue )
{
	this.setError ( false );

	var required = !this.optional || nextHasValue || false;

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

function XPParam ( container, defaultValue, optional, from, options )
{
	this.isLevels = from && from.isLevels ? from.isLevels : false;
	this.value = from && from.value ? from.value : '';
	this.optional = optional;
	this.options = options;

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

XPParam.prototype = new Param ( );

XPParam.prototype.onCheckChange = function ( e )
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

XPParam.prototype.update = function ( nextHasValue )
{
	this.setError ( false );

	var required = !this.optional || nextHasValue || false;

	if ( required && this.value === '' )
		this.setError ( true );

	if ( this.input.className === '' && this.value !== '' && isNaN ( parseInt ( this.value ) ) )
		this.setError ( true );

	if ( this.input.className === '' && this.value !== '' && parseInt ( this.value ) != this.value )
		this.setError ( true );

	if ( this.input.className === '' && this.value !== '' && !this.isLevels && parseInt ( this.value ) < 0 )
		this.setError ( true );
}

XPParam.prototype.toString = function ( )
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
	this.param = new TextParam ( cell, '', optional, from && from.param );
	row.appendChild ( cell );

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
	this.type = type;
	this.params = [];
	this.container = container;

	from = from && from.params;

	this.createParam ( container, 'x', PosParam, from, { optional: true } );
	this.createParam ( container, 'y', PosParam, from, { optional: true, height:true } );
	this.createParam ( container, 'z', PosParam, from, { optional: true } );
	this.createParam ( container, 'r', NumberParam, from, { optional: true } );
	this.createParam ( container, 'rm', NumberParam, from, { optional: true } );
	this.createParam ( container, 'm', NumberParam, from, { optional: true } );
	this.createParam ( container, 'c', NumberParam, from, { optional: true } );
	this.createParam ( container, 'l', NumberParam, from, { optional: true } );
	this.createParam ( container, 'lm', NumberParam, from, { optional: true } );
	//this.createParam ( container, 'team', TextParam, from, { optional: true } );
	//this.createParam ( container, 'name', TextParam, from, { optional: true } );

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
				this.createParam ( container, 'name', TextParam, from, { optional: true, remove: true, index: nameIndex++ } );
			}
			else if ( typeof from[i].name == 'string' && from[i].name == 'team' )
			{
				this.createParam ( container, 'team', TextParam, from, { optional: true, remove: true, index: teamIndex++ } );
			}
			else if ( typeof from[i].name !== 'string' && from[i].name.prefix == 'score_' )
			{
				if ( from[i].name.suffix && from[i].name.suffix == '_min' )
					this.createParam ( container, 'score__min', TextParam, from, { optional: true, remove: true, index: scoreMinIndex++, name: from[i].name.input.value } );
				else
					this.createParam ( container, 'score_', TextParam, from, { optional: true, remove: true, index: scoreIndex++, name: from[i].name.input.value } );
			}
		}
	}
}

//PlayerSelector.prototype = new Param ( );

PlayerSelector.prototype.createParam = function ( container, name, type, from, options )
{
	options = options || {};
	options.defaultValue = options.defaultValue === undefined ? undefined : options.defaultValue
	options.ignoreValue = options.ignoreValue === undefined ? false : options.ignoreValue
	options.ignoreIfHidden = options.ignoreIfHidden === undefined ? true : options.ignoreIfHidden
	options.optional = options.optional === undefined ? false : options.optional

	var row = document.createElement ( 'tr' );

	var cell = document.createElement ( 'th' );
	if ( name == 'score__min' )
	{
		var nameInput = document.createElement ( 'input' );
		nameInput.className = 'param-name';
		nameInput.value = options.name || ''
		nameInput.addEventListener ( 'change', updateCommand );
		var name = {
			prefix: 'score_',
			suffix: '_min',
			input: nameInput
		}
		cell.appendChild ( document.createTextNode ( 'score_' ) );
		cell.appendChild ( nameInput );
		cell.appendChild ( document.createTextNode ( '_min' ) );
	}
	else if ( name == 'score_' )
	{
		var nameInput = document.createElement ( 'input' );
		nameInput.className = 'param-name';
		nameInput.value = options.name || ''
		nameInput.addEventListener ( 'change', updateCommand );
		var name = {
			prefix: 'score_',
			input: nameInput
		}
		cell.appendChild ( document.createTextNode ( 'score_' ) );
		cell.appendChild ( nameInput );
	}
	else
		cell.appendChild ( document.createTextNode ( name ) );
	row.appendChild ( cell );

	var fromValue = null;
	var fromValueIndex = 0;
	if ( from )
	{
		for ( var i = 0; i < from.length; i++ )
		{
			if ( typeof from[i].name == 'string' )
			{
				if ( from[i].name == name )
				{
					if ( options.index == undefined || options.index == fromValueIndex )
					{
						fromValue = from[i].value
						break;
					}

					fromValueIndex++;
				}
			}
			else
			{
				if ( from[i].name.prefix + ( from[i].name.suffix || '' ) == ( typeof name == 'string' ? name : name.prefix + ( name.suffix || '' ) ) && from[i].name.input.value == options.name )
				{
					if ( options.index == undefined || options.index == fromValueIndex )
					{
						fromValue = from[i].value
						break;
					}

					fromValueIndex++;
				}
			}
		}
	}

	var cell = document.createElement ( 'td' );
	var value = new type ( cell, options.defaultValue, options.optional, fromValue, options );

	if ( options && options.remove )
	{
		var span = document.createElement ( 'span' );
		span.appendChild ( document.createTextNode ( 'Remove' ) );
		span.addEventListener ( 'click', ( function ( tag, parent ) { return function ( e ) { tag.onRemoveClick ( e, parent ) } } ) ( this, row ) );
		cell.appendChild ( span );
	}

	row.appendChild ( cell );

	if ( options && options.remove )
		container.insertBefore ( row, container.lastChild );
	else
		container.appendChild ( row );

	this.params.push ( {
		name: name,
		value: value,
		defaultValue: options.defaultValue,
		ignoreValue: options.ignoreValue,
		ignoreIfHidden: options.ignoreIfHidden,
		optional: options.optional,
		container: row
	} )
	//this.paramsOrdered.push ( this.params[name] );
}

PlayerSelector.prototype.onAddNameClick = function ( )
{
	this.createParam ( this.container, 'name', TextParam, null, { optional: true, remove: true } );
}

PlayerSelector.prototype.onAddTeamClick = function ( )
{
	this.createParam ( this.container, 'team', TextParam, null, { optional: true, remove: true } );
}

PlayerSelector.prototype.onAddScoreMinClick = function ( )
{
	this.createParam ( this.container, 'score__min', TextParam, null, { optional: true, remove: true } );
}

PlayerSelector.prototype.onAddScoreMaxClick = function ( )
{
	this.createParam ( this.container, 'score_', TextParam, null, { optional: true, remove: true } );
}

PlayerSelector.prototype.onRemoveClick = onRemoveClick;

PlayerSelector.prototype.update = function ( )
{
	for ( var i = 0; i < this.params.length; i++ )
	{
		this.params[i].value.update ( );
	}
}

PlayerSelector.prototype.toString = function ( )
{
	var output = this.type;

	var params = [];

	for ( var i = 0; i < this.params.length; i++ )
	{
		var name = this.params[i].name;
		if ( typeof name != 'string' )
			name = ( name.prefix || '' ) + name.input.value + ( name.suffix || '' )
		var value = this.params[i].value.toString ( );
		if ( value !== '' )
			params.push ( name + '=' + value );
	}

	return output + ( params.length ? '[' + params.join(',') + ']' : '' );
}

function Tag ( )
{
}

Tag.prototype.createTag = function ( container, name, type, children, optional )
{
	var row = document.createElement ( 'tr' );

	var cell = document.createElement ( 'th' );
	cell.appendChild ( document.createTextNode ( name ) );
	row.appendChild ( cell );

	var cell = document.createElement ( 'td' );
	console.log ( 'Tag'+type );
	var value = new window['Tag'+type] ( cell, children, optional );
	row.appendChild ( cell );

	container.appendChild ( row );

	if ( !this.tags )
		this.tags = {};

	this.tags[name] = {
		value: value,
		container: row
	}
}

Tag.prototype.createTable = function ( container, remove )
{
	var table = document.createElement ( 'table' );
	table.className = 'mc-tag-options';
	container.appendChild ( table );

	/*if ( remove )
	{
		var row = document.createElement ( 'tr' );

		var cell = document.createElement ( 'th' );
		row.appendChild ( cell );

		var cell = document.createElement ( 'td' );
		cell.appendChild ( document.createTextNode ( 'Remove' ) );
		cell.addEventListener ( 'click', ( function ( tag ) { return function ( e ) { tag.onRemoveClick ( e ) } } ) ( this ) );
		row.appendChild ( cell );

		table.appendChild ( row );
	}*/

	return table;
}

Tag.prototype.onRemoveClick = onRemoveClick;

Tag.prototype.update = function ( )
{
	if ( this.tags )
	{
		for ( var tag in this.tags )
		{
			this.tags[tag].value.update ( );
		}
	}

	if ( this.customs )
	{
		for ( var i = 0; i < this.customs.length; i++ )
		{
			if ( this.customs[i].value )
				this.customs[i].value.update ( );
		}
	}

	this.tag && this.tag.update ( );
}

Tag.prototype.toString = function ( )
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

	return ( this.tag && this.tag.toString ( ) ) || '';
}

function BlockGenericStructure ( )
{
	this.structure = {};
}

function ItemGenericStructure ( )
{
	this.structure = {
		'ench': {
			type: 'List',
			children: {
				type: 'Compound',
				children: {
					'id': 'Enchantment',
					'lvl': 'Short'
				}
			}
		},
		'StoredEnchantments': {
			type: 'List',
			children: {
				type: 'Compound',
				children: {
					'id': 'Enchantment',
					'lvl': 'Short'
				}
			}
		},
		'RepairCost': 'Int',

		'display': {
			type: 'Compound',
			children: {
				'Name': 'String',
				'Lore': {
					type: 'List',
					children: 'String'
				}
			}
		}
	};
}

function ItemBookAndQuillStructure ( )
{
	this.structure = (new ItemGenericStructure ( )).structure;

	this.structure.pages = {
		type: 'List',
		children: 'String'
	};
}

function ItemWrittenBookStructure ( )
{
	this.structure = (new ItemBookAndQuillStructure ( )).structure;

	this.structure.title = 'String'
	this.structure.author = 'String'
}

function ItemColourableStructure ( )
{
	this.structure = (new ItemGenericStructure ( )).structure;

	this.structure.display.color = 'RGB'
}

function ItemPotionStructure ( )
{
	this.structure = (new ItemGenericStructure ( )).structure;

	this.structure.CustomPotionEffects = {
		type: 'List',
		children: {
			type: 'Compound',
			children: {
				'Id': 'Byte',
				'Amplifier': 'Byte',
				'Duration': 'Int',
				'Ambient': 'Checkbox'
			}
		}
	};
}

function ItemPlayerSkullStructure ( )
{
	this.structure = (new ItemGenericStructure ( )).structure;

	this.structure.SkullOwner = 'String';
}

function ItemFireworkStarStructure ( )
{
	this.structure = (new ItemGenericStructure ( )).structure;

	this.structure.Explosion = {
		'Flicker': 'Checkbox',
		'Trail': 'Checkbox',
		'Type': 'Byte',
		'Colors': {
			type: 'List',
			children: 'Int'
		},
		'FadeColors': {
			type: 'List',
			children: 'Int'
		}
	};
}

function ItemFireworkStructure ( )
{
	this.structure = (new ItemGenericStructure ( )).structure;

	this.structure.Fireworks = {
		type: 'Compound',
		children: {
			'Flight': 'Byte',
			'Explosions': {
				'Flicker': 'Checkbox',
				'Trail': 'Checkbox',
				'Type': 'Byte',
				'Colors': {
					type: 'List',
					children: 'Int'
				},
				'FadeColors': {
					type: 'List',
					children: 'Int'
				}
			}
		}
	};
}

function TagBlockGeneric ( container, from )
{
	var structure = (new BlockGenericStructure ( )).structure;

	this.tag = new TagCompound ( container, structure, true, from );
}

TagBlockGeneric.prototype = new Tag ( );

function TagItemGeneric ( container, from )
{
	var structure = (new ItemGenericStructure ( )).structure;

	this.tag = new TagCompound ( container, structure, true, from );
}

TagItemGeneric.prototype = new Tag ( );

function TagItemBookAndQuill ( container, from )
{
	var structure = (new ItemBookAndQuillStructure ( )).structure;

	this.tag = new TagCompound ( container, structure, true, from );
}

TagItemBookAndQuill.prototype = new Tag ( );

function TagItemWrittenBook ( container, from )
{
	var structure = (new ItemWrittenBookStructure ( )).structure;

	this.tag = new TagCompound ( container, structure, true, from );
}

TagItemWrittenBook.prototype = new Tag ( );

function TagItemColourable ( container, from )
{
	var structure = (new ItemColourableStructure ( )).structure;

	this.tag = new TagCompound ( container, structure, true, from );
}

TagItemColourable.prototype = new Tag ( );

function TagCompound ( container, structure, optional, from )
{
	this.table = this.createTable ( container );

	for ( var name in structure )
	{
		var tag = structure[name];
		if ( typeof tag == 'string' )
			this.createTag ( this.table, name, tag, null, true, from && from.tags[name] || null );
		else
			this.createTag ( this.table, name, tag.type, tag.children || null, tag.optional || true, from && from.tags[name] || null );
	}

	var button = document.createElement ( 'button' );
	button.appendChild ( document.createTextNode ( 'Add Tag' ) );
	button.addEventListener ( 'click', ( function ( tagCompound ) { return function ( e ) { tagCompound.onAddButtonClick ( e ) } } ) ( this ) );
	container.appendChild ( button );
}

TagCompound.prototype = new Tag ( );

TagCompound.prototype.onAddButtonClick = function ( e )
{
	e = e || window.event;
	var target = e.target || e.srcElement;

	if ( e.preventDefault )
		e.preventDefault ( );

	this.addItem ( );

	return false;
}

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

function TagList ( container, structure, from, options )
{
	this.type = structure.type || structure;
	this.children = structure.children || null;
	this.container = container;
	this.tags = [];

	this.div = document.createElement ( 'div' );
	container.appendChild ( this.div );

	var button = document.createElement ( 'button' );
	button.appendChild ( document.createTextNode ( 'Add List Item' ) );
	button.addEventListener ( 'click', ( function ( tagList ) { return function ( e ) { tagList.onAddButtonClick ( e ) } } ) ( this ) );
	container.appendChild ( button );

	//this.addItem ( );
}

TagList.prototype = new Tag ( );

TagList.prototype.addItem = function ( )
{
	//var table = this.createTable ( this.div, true );
	console.log ( 'Tag' + this.type );
	var div = document.createElement ( 'div' );
	//div.className = 'mc-tag-options';

	var cell = document.createElement ( 'span' );
	cell.appendChild ( document.createTextNode ( 'Remove' ) );
	cell.addEventListener ( 'click', ( function ( tag, parent ) { return function ( e ) { tag.onRemoveClick ( e, parent ) } } ) ( this, div ) );
	div.appendChild ( cell );

	this.div.appendChild ( div );

	var value = new window['Tag' + this.type] ( div, this.children, true )

	this.tags.push ( {
		value: value,
		container: div
	} );

	updateCommand ( );
}

TagList.prototype.onAddButtonClick = function ( e )
{
	e = e || window.event;
	var target = e.target || e.srcElement;

	if ( e.preventDefault )
		e.preventDefault ( );

	this.addItem ( );

	return false;
}

function TagEnchantment ( container, structure, optional )
{
	this.tag = new EnchantmentParam ( container, '', true, null, {} );
}

TagEnchantment.prototype = new Tag ( );

function TagShort ( container, structure, optional )
{
	this.tag = new NumberParam ( container, '', optional, null, {} );
}

TagShort.prototype = new Tag ( );

TagInt = TagShort;
TagRGB = TagShort;

function TagString ( container, structure, optional )
{
	this.tag = new TextParam ( container, '', optional, null, {} );

	var span = document.createElement ( 'span' );
	span.className = 'input-button';
	span.appendChild ( document.createTextNode ( '§' ) )
	span.addEventListener ( 'click', ( function ( tag ) { return function ( e ) { tag.onSpecialClick ( e ) } } ) ( this ) );
	container.appendChild ( span );
}

TagString.prototype = new Tag ( );

TagString.prototype.onSpecialClick = function ( )
{
	var input = this.tag.input;

	input.focus ( );

	var selStart = input.selectionStart;
	var selStop = input.selectionEnd || selStart;
    var value = input.value;

	console.log ( selStart );
	console.log ( selStop );
	console.log ( value.slice(0, selStart) );
	console.log ( value.slice(selStop) );

    input.value = value.slice(0, selStart) + '§' + value.slice(selStop);

	input.selectionStart = selStart + 1;
	input.selectionEnd = selStart + 1;

	input.focus ( );/**/
	//var sel = document.selection.createRange();
	//sel.text = '§';
	//replaceSelectedText(this.tag.input, '§');
	//this.tag.input.focus ( );
}

TagString.prototype.toString = function ( )
{
	var value = this.tag.toString ( );
	if ( value !== '' )
		value = '"' + value.replace('"', '\"') + '"'

	return value;
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

	this.tag = new window['Tag'+tag] ( options );
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

/*

function createCommand ( container )
{
	container.className = 'mc-command';

	var selector = document.createElement ( 'select' );
	selector.className = 'mc-command-selector';
	selector.addEventListener ( 'change', onCommandChange );
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

	container.selector = selector;
	container.options = options;

	updateCommand ( container, selector.value );

	return container;
}

function updateCommand ( container, command )
{
	var options = container.options;

	options.innerHTML = '';

	container.command = new Command ( command, container.command );

	container.command.toHTML ( options );
}

function createCommandParam ( param )
{
	var cell = document.createElement ( 'td' );
	switch ( param.type )
	{
		case 'player':
			createPlayer ( cell );
		break;
		case 'static':
			createStatic ( cell );
		break;
		default:
			createUnknown ( cell );
	}
	return cell;
}

function onPlayerChange ( e )
{
	e = e || window.event;
	var target = e.target || e.srcElement;

	var selector = target.value;

	if ( !selector )
		return;

	var container = target.parentNode;

	updatePlayer ( container, selector );
}

function createPlayer ( container )
{
}

function readPlayer ( container )
{
	var selector = container.selector;
	var options = container.options;

	var player = new Player ( );

	switch ( selector.value )
	{
		case 'Username':
			player.text = readUnknown ( options.firstChild.children[1] )
		break;
		default:
			player.text = readUnknown ( options.firstChild.children[1] )
	}

	return player;
}

function updatePlayer ( container, selector, values )
{
	var options = container.options;

	options.innerHTML = '';

	container.player = new Player ( selector, container.player );

	container.player.toHTML ( options );
}

function createStatic ( container )
{
	container.className = 'mc-static';

	return container;
}

function createUnknown ( container )
{
	container.className = 'mc-unknown';

	var input = document.createElement ( 'input' );
	container.appendChild ( input );

	return container;
}

function readUnknown ( container )
{
	return container.firstChild.value;
}*/

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
	var text = document.getElementById ( 'mc-commands-text' );

	commandSelector.update ( );

	text.value = "";

	text.value = commandSelector.toString ( );

	text.select ( );

	text.className = document.getElementById('mc-command-reader').getElementsByClassName ( 'error' ).length ? 'error' : '';

	//console.log ( commandSelector );

	//console.log ( commandSelector.toString () );
}

function createSelector ( container )
{
	/*var commandSelector = createCommand ( document.createElement ( 'div' ) );
	container.appendChild ( commandSelector );*/

	var commandReader = document.createElement ( 'div' );
	commandReader.id = 'mc-command-reader';
	container.appendChild ( commandReader );

	commandSelector = new CommandSelector ( commandReader );
	commandReader.command = commandSelector;

	var commandText = document.createElement ( 'textarea' );
	commandText.id = 'mc-commands-text';
	commandText.readOnly = true;
	commandText.cols = 100;
	commandText.rows = 10;
	commandText.addEventListener ( 'click', ( function ( textarea ) { return function ( e ) { textarea.select ( ) } } ) ( commandText ) );
	container.appendChild ( commandText );

	/*var button = document.createElement ( 'button' );
	button.appendChild ( document.createTextNode ( 'Generate Command' ) );
	button.addEventListener ( 'click', onGenerateClick );
	commandReader.appendChild ( button );

	container.appendChild ( commandReader );*/

	updateCommand ( );
}

var parent = document.getElementById ( 'mc-commands' );
createSelector ( parent )
