'use strict';
var neo4j = require('neo4j');
var _ = require('lodash');
var config = require('./../../config/environment');
var UserModal = require('./../user/user.model');
var WSDL = require('./../../components/wsdl/mapwsdl.service');
var TreeModel = require('./../user/genealogytree.model');
var KycComponents = require('./../usermeta/utils.component.js');

var Genealogy = function() {

  var _conInfo = config.neo4j;
  var db = new neo4j.GraphDatabase(_conInfo.protocol + _conInfo.username + ':' + _conInfo.password + '@' + _conInfo.uri);
  var cypherQueries = {
    // Create new member in Graph DB
    'create': 'MATCH (n:ICUser {id: "REFID"}) CREATE (n)-[:MEMBER_OF {since:"JOINAT_SINCE", hpos: n.hpos+1 }]->(ci:ICUser {id: {userId}, name: {userName}, sponsor: {userSponsor}, joinat: {userJoinAt}, hpos: n.hpos+1, ip: {userIP}, email: {userEmail}, countryname: {countryName}, countrycode: {countryCode}, sponsorId: {userSponsorId}, sponsorUsername: {userSponsorName}, silverpacks: 0, goldpacks: 0, adcpacks : 0}) RETURN ci,n',

    // Show list of all members under this user; upto specified levels
    'getMembers': 'MATCH (n:ICUser {id: "REFID"})-[:MEMBER_OF*..LEVEL_NUMBER]->(j) DATE_CLAUSE OPTIONAL MATCH (b:ICUser {id: j.id})-[:MEMBER_OF*]->(mem) RETURN j.id as member_id, j.sponsor as sponsor_id, j.name as member_name, j.sponsorId as user_sponsor_id, j.sponsorUsername as user_sponsor_name, j.joinat as joinat, (j.hpos - n.hpos) as generation_level, j.countrycode as country, COUNT(mem) as members_count, j.email as email, j.silverpacks as silverpacks, j.goldpacks as goldpacks, j.adcpacks as adcpacks ORDER BY joinat ORDER_DIRECTION SKIP OFFSET LIMIT VIEW_LIMIT',

    // Show list of all members under this user; Under at specified levels
    'getLevelMembers': 'MATCH (n:ICUser {id: "REFID"})-[:MEMBER_OF*LEVEL_NUMBER]->(j) DATE_CLAUSE OPTIONAL MATCH (b:ICUser {id: j.id})-[:MEMBER_OF*]->(mem) RETURN j.id as member_id, j.sponsor as sponsor_id, j.name as member_name, j.sponsorId as user_sponsor_id, j.sponsorUsername as user_sponsor_name, j.joinat as joinat, (j.hpos - n.hpos) as generation_level, j.countrycode as country, COUNT(mem) as members_count, j.email as email, j.silverpacks as silverpacks, j.goldpacks as goldpacks, j.adcpacks as adcpacks ORDER BY CUSTOM_ORDER joinat ORDER_DIRECTION SKIP OFFSET LIMIT VIEW_LIMIT',

    // Show list of all members under this user; Under at specified levels
    'getFilterLevelMembers': 'MATCH (n:ICUser {id: "REFID"})-[:MEMBER_OF*LEVEL_NUMBER]->(j) DATE_CLAUSE PACKS_CLAUSE OPTIONAL MATCH (b:ICUser {id: j.id})-[:MEMBER_OF*]->(mem) RETURN j.id as member_id, j.sponsor as sponsor_id, j.name as member_name, j.sponsorId as user_sponsor_id, j.sponsorUsername as user_sponsor_name, j.joinat as joinat, (j.hpos - n.hpos) as generation_level, j.countrycode as country, COUNT(mem) as members_count, j.email as email, j.silverpacks as silverpacks, j.goldpacks as goldpacks, j.adcpacks as adcpacks ORDER BY CUSTOM_ORDER joinat ORDER_DIRECTION SKIP OFFSET LIMIT VIEW_LIMIT',

    // Show list of all members under this user; upto specified levels
    'getListMembers': 'MATCH (n:ICUser {sponsor: "REFID"})-[:MEMBER_OF*..LEVEL_NUMBER]->(j) DATE_CLAUSE OPTIONAL MATCH (b:ICUser {id: j.id})-[:MEMBER_OF*]->(mem) RETURN j.id as member_id, j.sponsor as sponsor_id, j.name as member_name, j.sponsorId as user_sponsor_id, j.sponsorUsername as user_sponsor_name, j.joinat as joinat, (j.hpos - n.hpos) as generation_level, j.countrycode as country, COUNT(mem) as members_count, j.email as email, j.silverpacks as silverpacks, j.goldpacks as goldpacks, j.adcpacks as adcpacks ORDER BY joinat ORDER_DIRECTION SKIP OFFSET LIMIT VIEW_LIMIT',

    // Show list of all members under this user; Under at specified levels
    'getListLevelMembers': 'MATCH (n:ICUser {sponsor: "REFID"})-[:MEMBER_OF*LEVEL_NUMBER]->(j) DATE_CLAUSE OPTIONAL MATCH (b:ICUser {id: j.id})-[:MEMBER_OF*]->(mem) RETURN j.id as member_id, j.sponsor as sponsor_id, j.name as member_name, j.sponsorId as user_sponsor_id, j.sponsorUsername as user_sponsor_name, j.joinat as joinat, (j.hpos - n.hpos) as generation_level, j.countrycode as country, COUNT(mem) as members_count, j.email as email, j.silverpacks as silverpacks, j.goldpacks as goldpacks, j.adcpacks as adcpacks ORDER BY CUSTOM_ORDER joinat ORDER_DIRECTION SKIP OFFSET LIMIT VIEW_LIMIT',


    'searchEmailLevelMembers': 'MATCH (n:ICUser {id: "REFID"})-[:MEMBER_OF*..LEVEL_NUMBER]->(j) WHERE j.email = "SEARCH" RETURN j.id as member_id, j.sponsor as sponsor_id, j.name as member_name, j.sponsorId as user_sponsor_id, j.sponsorUsername as user_sponsor_name, j.joinat as joinat, (j.hpos - n.hpos) as generation_level, j.countrycode as country, j.email as email, j.silverpacks as silverpacks, j.goldpacks as goldpacks, j.adcpacks as adcpacks ORDER BY joinat ORDER_DIRECTION SKIP OFFSET LIMIT VIEW_LIMIT',

    'searchNameLevelMembers': 'MATCH (n:ICUser {id: "REFID"})-[:MEMBER_OF*..LEVEL_NUMBER]->(j) WHERE j.name =~ "(?i).*SEARCH.*" RETURN j.id as member_id, j.sponsor as sponsor_id, j.name as member_name, j.sponsorId as user_sponsor_id, j.sponsorUsername as user_sponsor_name, j.joinat as joinat, (j.hpos - n.hpos) as generation_level, j.countrycode as country, j.email as email, j.silverpacks as silverpacks, j.goldpacks as goldpacks, j.adcpacks as adcpacks ORDER BY joinat ORDER_DIRECTION SKIP OFFSET LIMIT VIEW_LIMIT',

    'searchMembers': 'MATCH (n:ICUser {id: "REFID"})-[:MEMBER_OF*..LEVEL_NUMBER]->(j) WHERE j.email =~ "(?i).*SEARCH.*" OR j.name =~ "(?i).*SEARCH.*" RETURN j.id as member_id, j.sponsor as sponsor_id, j.name as member_name, j.sponsorId as user_sponsor_id, j.sponsorUsername as user_sponsor_name, j.joinat as joinat, (j.hpos - n.hpos) as generation_level, j.countrycode as country, j.email as email, j.silverpacks as silverpacks, j.goldpacks as goldpacks, j.adcpacks as adcpacks ORDER BY joinat ORDER_DIRECTION SKIP OFFSET LIMIT VIEW_LIMIT',

    // Show list of all members under this user; upto specified levels
    'getMembersWithoutLimit': 'MATCH (n:ICUser {id: "REFID"})-[:MEMBER_OF*..LEVEL_NUMBER]->(j) DATE_CLAUSE OPTIONAL MATCH (b:ICUser {id: j.id})-[:MEMBER_OF*]->(mem) RETURN j.id as member_id, j.sponsor as sponsor_id, j.name as member_name, j.sponsorId as user_sponsor_id, j.sponsorUsername as user_sponsor_name, j.joinat as joinat, (j.hpos - n.hpos) as generation_level, j.countrycode as country, COUNT(mem) as members_count, j.email as email ORDER BY joinat ORDER_DIRECTION',

    // Show list of all members under this user; Under at specified levels
    'getLevelMembersWithoutLimit': 'MATCH (n:ICUser {id: "REFID"})-[:MEMBER_OF*LEVEL_NUMBER]->(j) DATE_CLAUSE OPTIONAL MATCH (b:ICUser {id: j.id})-[:MEMBER_OF*]->(mem) RETURN j.id as member_id, j.sponsor as sponsor_id, j.name as member_name, j.sponsorId as user_sponsor_id, j.sponsorUsername as user_sponsor_name, j.joinat as joinat, (j.hpos - n.hpos) as generation_level, j.countrycode as country, COUNT(mem) as members_count, j.email as email, j.silverpacks as silverpacks, j.goldpacks as goldpacks, j.adcpacks as adcpacks ORDER BY joinat ORDER_DIRECTION',

    // Find total user just below this user
    'countMembers': 'MATCH (u:ICUser {id: "REFID"})-[:MEMBER_OF {hpos: j.hpos}]->(j) RETURN COUNT(j)',

    // Find total level user just below this user
    'listCount': 'MATCH (u:ICUser {id: "REFID"})-[:MEMBER_OF*LEVEL_NUMBER]->(j) RETURN COUNT(j) as members',

    // Find one member information and return its ID and Name
    'singleMember': 'MATCH (u:ICUser {id: "REFID"}) RETURN u.id as id, u.name as name LIMIT 1',

    'memberCountry': 'MATCH (u:ICUser {id: "REFID"})-[:MEMBER_OF*]->(r) RETURN r.countryname as name, r.countrycode as country, count(*) as users ORDER BY count(*) DESC',

    //leaderBoardMembersDirects: 'MATCH(c:ICUser)-[:MEMBER_OF]->(r) WITH r,c MATCH (n:ICUser {id: c.id}) WHERE r.joinat >= "JOIN_AT_MIN" AND r.joinat < "JOIN_AT_MAX" AND r.sponsor <> "569764a66110ef9f6810c2ea" RETURN r.sponsor as id, n.name as name, count(*) as users, r.countrycode as country ORDER BY count(*) DESC',

    //leaderBoardMembersAllTimeDirects: 'MATCH(c:ICUser)-[:MEMBER_OF]->(r) WITH r,c MATCH (n:ICUser {id: c.id}) WHERE r.sponsor <> "569764a66110ef9f6810c2ea" RETURN r.sponsor as id, n.name as name, count(*) as users, r.countrycode as country ORDER BY count(*) DESC',

    //leaderBoardMembersAllDirects: 'MATCH (n:ICUser)-[:MEMBER_OF*..3]->(j) WHERE j.joinat >= "JOIN_AT_MIN" AND j.joinat < "JOIN_AT_MAX" AND j.sponsor <> "569764a66110ef9f6810c2ea" MATCH (p:ICUser {id: j.sponsor}) OPTIONAL MATCH (b:ICUser {id: j.id})-[:MEMBER_OF*]->(mem) RETURN j.id as id, j.name as name, COUNT(mem) as users, j.countrycode as country ORDER BY COUNT(mem) DESC',

    //leaderBoardMembersAllTimeAllDirects: 'MATCH (n:ICUser)-[:MEMBER_OF*..3]->(j) MATCH (p:ICUser {id: j.sponsor}) OPTIONAL MATCH (b:ICUser {id: j.id})-[:MEMBER_OF*]->(mem) WHERE j.sponsor <> "569764a66110ef9f6810c2ea" RETURN j.id as id, j.name as name, COUNT(mem) as users, j.countrycode as country ORDER BY COUNT(mem) DESC',

    'latestSignup': 'MATCH(c:ICUser) RETURN DISTINCT c.id as id, c.name as name, c.joinat as signupDate, c.countrycode as country ORDER BY signupDate DESC SKIP OFFSET LIMIT 20',

    'getLevelMySignups': 'MATCH (c:ICUser {id: "REFID"})-[:MEMBER_OF*LEVEL_NUMBER]->(n) RETURN count(n) as members',

    'getMySignups': 'MATCH (c:ICUser {id: "REFID"})-[:MEMBER_OF*..1]->(n) WHERE_CLAUSE RETURN count(n) as members',

    'getMyTeamSignups': 'MATCH (c:ICUser {id: "REFID"})-[:MEMBER_OF*]->(n) WHERE_CLAUSE RETURN count(n) as members',

    'updateGraphNode': 'MATCH (u:ICUser {id: "REFID"}) SET u.countrycode="countryCode", u.countryname="countryName", u.email="userEmail", u.name="userName"',

    'getLevelMembersCount': 'MATCH (u:ICUser {id: "REFID"})-[:MEMBER_OF*LEVEL_NUMBER]-(n) RETURN count(n)',

    'findMemberById': 'MATCH (c:ICUser {id: "REFID"}) RETURN c',

    'verifyUser':'MATCH (c:ICUser {id: "USER_ID"}) RETURN c',

    'verifySponsor':'MATCH (c:ICUser {id: "USER_ID"}) RETURN c',

    'verifyByIds': 'MATCH (c:ICUser) WHERE c.id IN USER_IDS RETURN c',

    'SponsorUpdate':'MATCH (n:ICUser {id: "sponsorUserId"}) CREATE (n)-[:MEMBER_OF {since:"createdat", hpos: n.hpos+1 }]->(ci:ICUser {id: "userId", name: "userName", sponsor: "sponsorId", joinat: "joindat", hpos: n.hpos+1, ip: "", email: "userEmail", countryname: "countryName", countrycode: "countryCode", sponsorId: sponsorProfileId, sponsorUsername: "sponsorUsersName"}) RETURN ci,n',

    ///////////////////////////Sponsor Already exit////////////////////////

    'changeSponsorInfo' : 'MATCH (c:ICUser {id: "USER_ID"}) WITH c SET c.sponsor="SPONSOR_ID", c.sponsorUsername="SPONSOR_USERNAME", c.sponsorId=SPONSOR_USER_PROFILE_ID, c.hpos=NEW_HPOS RETURN c',

    // 'clearOldRelation' : 'START n=node(*) MATCH (n)-[rel:MEMBER_OF]->(r) WHERE n.id="OLD_SPONSOR_ID" AND r.id="USER_ID" DELETE rel',
    'clearOldRelation' : 'MATCH (n)-[rel:MEMBER_OF]->(r) WHERE n.id="OLD_SPONSOR_ID" AND r.id="USER_ID" DELETE rel',

    'addRelation' :'MATCH (b:ICUser),(c:ICUser) WHERE b.id = "NEW_SPONSOR_ID" AND c.id = "USER_ID" CREATE (b)-[r:MEMBER_OF {since:c.joinat, hpos: b.hpos+1}]->(c) RETURN r',

    'validRequest': 'MATCH (c:ICUser {id: "REFID"})-[:MEMBER_OF*]->(n) WHERE n.id = "USER_ID" RETURN count(n) as validMember',

    'isUnique': 'MATCH (c:ICUser {email: "USER_EMAIL"}) RETURN COUNT(c) as isUnique',

    'updatePacksInfo': 'MATCH (c:ICUser {id: "REFID"}) SET c.silverpacks = SILVER_PACKS, c.goldpacks = GOLD_PACKS RETURN c',

    'timeBasedSignupCounts': 'MATCH (c:ICUser {id: "REFID"})-[:MEMBER_OF*1]->(n) WHERE n.joinat >= "DAY1_FROM" AND n.joinat < "DAY1_TO" RETURN count(n) AS totalUsers, "1" as numberOfDays, "1" as level UNION MATCH (c:ICUser {id: "REFID"})-[:MEMBER_OF*..3]->(n) WHERE n.joinat >= "DAY1_FROM" AND n.joinat < "DAY1_TO" RETURN count(n) AS totalUsers, "1" as numberOfDays, "7" as level UNION MATCH (c:ICUser {id: "REFID"})-[:MEMBER_OF*1]->(n) WHERE n.joinat >= "DAY7_FROM" AND n.joinat < "DAY7_TO" RETURN count(n) AS totalUsers, "7" as numberOfDays, "1" as level UNION MATCH (c:ICUser {id: "REFID"})-[:MEMBER_OF*..3]->(n) WHERE n.joinat >= "DAY7_FROM" AND n.joinat < "DAY7_TO" RETURN count(n) AS totalUsers, "7" as numberOfDays, "7" as level UNION MATCH (c:ICUser {id: "REFID"})-[:MEMBER_OF*1]->(n) WHERE n.joinat >= "DAY30_FROM" AND n.joinat < "DAY30_TO" RETURN count(n) AS totalUsers, "30" as numberOfDays, "1" as level UNION MATCH (c:ICUser {id: "REFID"})-[:MEMBER_OF*..3]->(n) WHERE n.joinat >= "DAY30_FROM" AND n.joinat < "DAY30_TO" RETURN count(n) AS totalUsers, "30" as numberOfDays, "7" as level UNION MATCH (c:ICUser {id: "REFID"})-[:MEMBER_OF*1]->(n) WHERE n.joinat >= "DAY365_FROM" AND n.joinat < "DAY365_TO" RETURN count(n) AS totalUsers, "365" as numberOfDays, "1" as level UNION MATCH (c:ICUser {id: "REFID"})-[:MEMBER_OF*..3]->(n) WHERE n.joinat >= "DAY365_FROM" AND n.joinat < "DAY365_TO" RETURN count(n) AS totalUsers, "365" as numberOfDays, "7" as level',

    'listAllUserUpto7Level': 'MATCH (c:ICUser {id: "REFID"})-[:MEMBER_OF*..3]->(n) RETURN n.id as id, n.name as name, n.email as email, n.joinat as joinAt, n.countryname as countryName, n.countrycode as countryCode, (n.hpos - c.hpos) as level ORDER BY joinAt DESC SKIP OFFSET LIMIT VIEW_LIMIT',

    'saleMembers': 'MATCH (c:ICUser {id: "REFID"})-[:MEMBER_OF*..3]->(n) WHERE (n.silverpacks > 0 OR n.goldpacks > 0) RETURN DISTINCT n.id as saleMembers',

    'listSaleAllUserUpto7Level': 'MATCH (c:ICUser {id: "REFID"})-[:MEMBER_OF*..3]->(n) WHERE (n.silverpacks > 0 OR n.goldpacks > 0) RETURN DISTINCT n.id as id, n.name as name, n.email as email, (n.hpos - c.hpos) as level, n.goldpacks as goldPacks, n.silverpacks as silverPacks, n.adcpacks as adcpacks ORDER BY n.goldpacks DESC, n.silverpacks DESC SKIP OFFSET LIMIT VIEW_LIMIT',

    'listSaleAllUserUpto7LevelCount': 'MATCH (c:ICUser {id: "REFID"})-[:MEMBER_OF*..3]->(n) WHERE (n.silverpacks > 0 OR n.goldpacks > 0) RETURN COUNT(DISTINCT n) as members'
  }

  var isValidRequest = function(loggedInUser, requestedMember, callback) {
    var query = cypherQueries.validRequest.replace('REFID', loggedInUser).replace('USER_ID', requestedMember);
    db.cypher(query, callback);
  }

  return {

    isUnique: function(email, callback) {

      var _query = this._prepareQuery('isUnique', {
        'USER_EMAIL': email
      });

      return db.cypher(_query, callback);
    },

    validRequest: function(loginUser, listUser, callback) {
      return isValidRequest(loginUser, listUser, callback);
    },

    getModel: function() {

      return db;
    },

    getlistAllUserUpto7Level: function(userId, pageView, _callback) {

      var offset = ((pageView - 1) * parseInt(config.minPaginationLimit));

      return db.cypher(this._prepareQuery('listAllUserUpto7Level', {
        'REFID': userId+'',
        'VIEW_LIMIT': parseInt(config.minPaginationLimit),
        'OFFSET': offset
      }), _callback);
    },

    getlistSaleAllUserUpto7Level: function(userId, pageView, _callback) {

      var offset = ((pageView - 1) * parseInt(config.minPaginationLimit));
      return db.cypher(this._prepareQuery('listSaleAllUserUpto7Level', {
        'REFID': userId+'',
        'VIEW_LIMIT': parseInt(config.minPaginationLimit),
        'OFFSET': offset
      }), _callback);
    },

    getlistSaleAllUserUpto7LevelCount: function(userId, _callback) {
      return db.cypher(this._prepareQuery('listSaleAllUserUpto7LevelCount', {'REFID': userId}), _callback);
    },

    getcountAllUserUpto7Level: function(userId, _callback) {

      var _query = this._prepareQuery('getLevelMembersCount', {
        'REFID': userId+'',
        'LEVEL_NUMBER': '..3'
      }).replace('-(n)', '->(n)');
      return db.cypher(_query, _callback);
    },

    updatePacksInfo: function(dataObj, _callback) {
      var _that = this;

      return db.cypher(_that._prepareQuery('updatePacksInfo', {
        'REFID': dataObj.userId,
        'SILVER_PACKS': parseInt(dataObj.silverPacks),
        'GOLD_PACKS': parseInt(dataObj.goldPacks)
      }), _callback);
    },

    updateRelationAndSponsor: function(queryObj, _callback) {

      var clearOldRelation = this._prepareQuery('clearOldRelation', {
        'OLD_SPONSOR_ID': queryObj.oldSponsorId,
        'USER_ID': queryObj.userId
      });

      var changeSponsorInfo = this._prepareQuery('changeSponsorInfo', {
        'USER_ID': queryObj.userId,
        'SPONSOR_ID': queryObj.newSponsorId,
        'SPONSOR_USERNAME': queryObj.sponsorUsername,
        'SPONSOR_USER_PROFILE_ID': queryObj.sponsorProfileId,
        'NEW_HPOS': queryObj.userNewHpos
      });

      var addRelation = this._prepareQuery('addRelation', {
        'USER_ID': queryObj.userId,
        'NEW_SPONSOR_ID': queryObj.newSponsorId
      });

      db.cypher(clearOldRelation, function(e, d) {
        if(e) { return _callback(e, d); }

        db.cypher(changeSponsorInfo, function(er, da) {

          if(er) { return _callback(er, da) }

          db.cypher(addRelation, _callback);
        });
      });
    },

    /**
     * Prepare Query Statement
     *
     * @param: String queryType
     * @param: object data
     * @return: String
     */
    _prepareQuery: function(queryType, data) {
      var _query = cypherQueries[queryType];
      for(var idx in data) {
        _query = _query.split(idx).join(data[idx]);
      }

      if(_query.indexOf('SKIP 0 LIMIT 0') >= 0) {
        _query = _query.replace('SKIP 0 LIMIT 0', '');
      }

      console.log(_query);

      return _query;
    },

    /**
     * Prepare Where clause for Query based on joinat
     * date of the member
     *
     * @param: String fromDate
     * @param: String toDate
     * @return: String
     */
    _getDateRangeCaluse: function(fromDate, toDate) {
      var _clause = '';

      if(fromDate && toDate && fromDate.trim() != '' && toDate.trim() != '' && fromDate != 0 && toDate != 0) {
        var _from = new Date(fromDate),
            _to   = new Date(toDate);

        // Add one day to get data/members from DB between two dates (including from and to date)
        _to.setTime(_to.getTime() + (24*60*60*1000));

        _clause = 'WHERE j.joinat > "' + _from.toISOString() + '" AND j.joinat < "' + _to.toISOString() + '"';
      }

      return _clause;
    },

    /**
     * Create user in Graph DB
     *
     * @param: object data
     * @param: function _callback
     */
    create: function(data, _callback) {

      var currentDate = data.user.joinAt || new Date();
      var _that = this;

      if(data.ref.length == 0) {
        data.ref = [config.sponsorId];
      }

      UserModal.findById(data.ref[0], function(err, _user) {
        var _sponsorUserName = '';
        if(!err && _user) {
          _sponsorUserName = _user.username ? _user.username : '';
        }

        // Add user to KYC
        KycComponents.saveNewUserKyc( data.user.id, function ( data ) {
          if ( data.error ) {
            console.log( " New registered to KYC " );
          }
          else {
            console.log( " New registered not registered to KYC " );
          }
        });

        // Place user in Tree
        db.cypher({
          "query": _that._prepareQuery('create', {
            'REFID': data.ref[0],
            'JOINAT_SINCE': currentDate
          }),
          "params": {
            userId: data.user.id,
            userName: data.user.name,
            userSponsor: data.ref[0],
            userJoinAt: currentDate,
            userIP: (data.user.ip || '0.0.0.0'),
            userEmail: data.user.email,
            countryName: (data.user.countryName || ''),
            countryCode: (data.user.countryCode || ''),
            userSponsorId: (data.ref[2] || 2),
            userSponsorName: (_sponsorUserName || config.sponsorUn)
          }
        }, _callback);

        TreeModel.create({refererid: data.ref[0]}, function(err, data) {
          console.log('TreeModel Save: if not see error info >>> ', err, '<<< else Saved');
        });

      });



    },

    /**
     * Run query on DB to find the members information
     * based on parameter "data"
     *
     * @param: Object data
     * @param: Function _callback
     */
    list: function(data, _callback) {

      var viewPage    = data.page,
          viewLimit   = (data.exportList ? 0 : config.minPaginationLimit),
          viewOffset  = ((viewPage > 1) ? ((viewPage - 1) * viewLimit) : 0),
          dataQuery   = 'getMembers',
          viewLevel   = ((data.level == 'all') ? 3 : data.level),
          orderDir    = data.dir,
          countQuery  = false,
          cQuery      = '',
          _scope      = this,
          customOrder = '',
          dateClause  = _scope._getDateRangeCaluse(data.from, data.to),
          packsClause = '';

      if(data.from == 0){
        data.from = null;
        data.to = null;
      }
      if(data.searchfield == 0){
        data.search = null;
      }
      if(data.search == 0){
        data.searchfield = null,
        data.search = null
      }
      if(data.level == 'all' || 0){
        countQuery = true;
        cQuery = 'MATCH (n:ICUser {id: "'+data.sponsor+'"})-[:MEMBER_OF*'+'..'+viewLevel+']->(j) RETURN count(*) as totalusers';
      }

      if(data.level != 'all') {
        dataQuery = 'getLevelMembers';
        countQuery = true;
        cQuery = 'MATCH (n:ICUser {id: "'+data.sponsor+'"})-[:MEMBER_OF*'+viewLevel+']->(j) RETURN count(*) as totalusers';
        customOrder = 'members_count DESC,';
      }

      if(viewLimit == 0 && data.level != 'all') {
        dataQuery = 'getLevelMembersWithoutLimit';
      }
      if(viewLimit == 0 && data.level == 'all') {
        dataQuery = 'getMembersWithoutLimit';
      }

      if(data.viewas == 'grid' && viewLimit > 0) {
        viewLimit = config.maxPaginationLimit;
        countQuery = true;
        cQuery     = 'MATCH (n:ICUser {id: "'+data.sponsor+'"})-[:MEMBER_OF*'+viewLevel+']->(j) RETURN count(*) as totalusers';
        customOrder = 'members_count DESC,';
      }

      if(data.searchfield == 'email'){
        dataQuery = 'searchEmailLevelMembers';
        countQuery = true;
        cQuery = 'MATCH (n:ICUser {id: "'+data.sponsor+'"})-[:MEMBER_OF*..'+viewLevel+']->(j) WHERE j.email ="'+ data.search +'.*" RETURN count(*) as totalusers'
      }

      if(data.searchfield == 'name'){
        dataQuery = 'searchNameLevelMembers';
        countQuery = true;
        cQuery = 'MATCH (n:ICUser {id: "'+data.sponsor+'"})-[:MEMBER_OF*..'+viewLevel+']->(j) WHERE j.name =~ "(?i).*'+ data.search +'.*" RETURN count(*) as totalusers'
      }

      if(data.searchfield == 'all'){
        dataQuery = 'searchMembers';
        countQuery = true;
        cQuery = 'MATCH (n:ICUser {id: "'+data.sponsor+'"})-[:MEMBER_OF*..'+viewLevel+']->(j) WHERE j.name =~ "(?i).*'+ data.search +'.*" OR j.email =~ ".*'+ data.search +'.*" RETURN count(*) as totalusers'
      }

      // Gold Pack, Silver Pack Filter
      if(
        (data.mingoldpacks && data.maxgoldpacks && parseInt(data.mingoldpacks) >= 0 && parseInt(data.maxgoldpacks) > 0) ||
        (data.minsilverpacks && data.maxsilverpacks && parseInt(data.minsilverpacks) >= 0 && parseInt(data.maxsilverpacks) > 0)
      ) {
        dataQuery = 'getFilterLevelMembers';
        var subQuery = '';

        if((data.mingoldpacks && data.maxgoldpacks && parseInt(data.mingoldpacks) >= 0 && parseInt(data.maxgoldpacks) > 0)) {
          subQuery = subQuery + 'j.goldpacks >= '+parseInt(data.mingoldpacks)+' AND j.goldpacks <= '+parseInt(data.maxgoldpacks);
        }

        if((data.minsilverpacks && data.maxsilverpacks) && parseInt(data.minsilverpacks) >= 0 && parseInt(data.maxsilverpacks) > 0) {
          subQuery = (subQuery!='' ? subQuery+' AND ' : subQuery) + 'j.silverpacks >= '+parseInt(data.minsilverpacks)+' AND j.silverpacks <= '+parseInt(data.maxsilverpacks);
        }

        if(dateClause === '') {
          packsClause = 'WHERE ' + subQuery;
        }
        else {
          packsClause = ' AND ' + subQuery;
        }

        cQuery = cQuery.replace('RETURN', 'WHERE ' + subQuery + ' RETURN');
      }
      console.log("dataQuery: "+_scope._prepareQuery(dataQuery, {
        'REFID': data.sponsor,
        'LEVEL_NUMBER': data.level,
        'OFFSET': viewOffset,
        'VIEW_LIMIT': viewLimit,
        'ORDER_DIRECTION': orderDir,
        'DATE_CLAUSE': dateClause,
        'SEARCH' : data.search,
        'CUSTOM_ORDER': customOrder,
        'PACKS_CLAUSE': packsClause
      }));
      console.log("cQuery: "+cQuery);

      // Query to find members based on data parameter values
      db.cypher(_scope._prepareQuery(dataQuery, {
        'REFID': data.sponsor,
        'LEVEL_NUMBER': data.level,
        'OFFSET': viewOffset,
        'VIEW_LIMIT': viewLimit,
        'ORDER_DIRECTION': orderDir,
        'DATE_CLAUSE': dateClause,
        'SEARCH' : data.search,
        'CUSTOM_ORDER': customOrder,
        'PACKS_CLAUSE': packsClause
      }), function(_error, _data) {
        if(_error) {
          _callback(_error, _data);
        }
        else {

          // Query on DB to find the sponsor information
          db.cypher(_scope._prepareQuery('singleMember', {
            'REFID': data.sponsor
          }), function(sponsorError, sponsorData) {

            var members = {
              members: _data,
              sponsor: {
                id: data.sponsor,
                name: ''
              }
            }

            if(!sponsorError) {
              members.sponsor.name = sponsorData[0].name;
            }

            if(countQuery && cQuery != '') {

              db.cypher(cQuery, function(cqerr, cqresp) {
                if(cqerr){
                  console.log(cqerr);
                }
                members['totalUsers'] = ((cqresp && cqresp.length > 0) ? cqresp[0].totalusers : 0);
                return _callback(null, members);
              });
            }
            else {
              return _callback(null, members);
            }
          });

        }

      });
    },

    /**
     * Run query on DB to find the members information
     * based on parameter "data"
     *
     * @param: Object data
     * @param: Function _callback
     */
    levelList: function(data, _callback) {
      var viewPage   = data.page,
          viewLimit  = config.minPaginationLimit,
          viewOffset = ((viewPage > 1) ? ((viewPage - 1) * viewLimit) : 0),
          dataQuery  = 'getListMembers',
          viewLevel  = ((data.level == 'all') ? 3 : data.level),
          orderDir   = data.dir,
          countQuery = false,
          cQuery     = '',
          _scope     = this,
          customOrder = '';

      if(data.from == 0){
        data.from = null;
        data.to = null;
      }
      if(data.searchfield == 0){
        data.search = null;
      }
      if(data.search == 0){
        data.searchfield = null,
        data.search = null
      }
      if(data.level == 'all' || 0){
        countQuery = true;
        cQuery = 'MATCH (n:ICUser {id: "'+data.sponsor+'"})-[:MEMBER_OF*'+'..'+viewLevel+']->(j) RETURN count(*) as totalusers';
      }

      if(data.level != 'all') {
        dataQuery = 'getListLevelMembers';
        countQuery = true;
        cQuery = 'MATCH (n:ICUser {id: "'+data.sponsor+'"})-[:MEMBER_OF*1]->(j) RETURN count(*) as totalusers';
        customOrder = 'members_count DESC,';
      }

      if(viewLimit == 0 && data.level != 'all') {
        dataQuery = 'getLevelMembersWithoutLimit';
      }
      if(viewLimit == 0 && data.level == 'all') {
        dataQuery = 'getMembersWithoutLimit';
      }

      if(data.viewas == 'grid' && viewLimit > 0) {
        viewLimit = config.maxPaginationLimit;
        countQuery = true;
        cQuery     = 'MATCH (n:ICUser {id: "'+data.sponsor+'"})-[:MEMBER_OF*1]->(j) RETURN count(*) as totalusers';
        customOrder = 'members_count DESC,';
      }

      if(data.searchfield == 'email'){
        dataQuery = 'searchEmailLevelMembers';
        countQuery = true;
        cQuery = 'MATCH (n:ICUser {id: "'+data.sponsor+'"})-[:MEMBER_OF*..'+viewLevel+']->(j) WHERE j.email =~ ".*'+ data.search +'.*" RETURN count(*) as totalusers'
      }

      if(data.searchfield == 'name'){
        dataQuery = 'searchNameLevelMembers';
        countQuery = true;
        cQuery = 'MATCH (n:ICUser {id: "'+data.sponsor+'"})-[:MEMBER_OF*..'+viewLevel+']->(j) WHERE j.name =~ "(?i).*'+ data.search +'.*" RETURN count(*) as totalusers'
      }

      if(data.searchfield == 'all'){
        dataQuery = 'searchMembers';
        countQuery = true;
        cQuery = 'MATCH (n:ICUser {id: "'+data.sponsor+'"})-[:MEMBER_OF*..'+viewLevel+']->(j) WHERE j.name =~ "(?i).*'+ data.search +'.*" OR j.email =~ ".*'+ data.search +'.*" RETURN count(*) as totalusers'
      }

      // Query to find members based on data parameter values
      db.cypher(_scope._prepareQuery(dataQuery, {
        'REFID': data.sponsor,
        'LEVEL_NUMBER': 0,
        'OFFSET': viewOffset,
        'VIEW_LIMIT': viewLimit,
        'ORDER_DIRECTION': orderDir,
        'DATE_CLAUSE': _scope._getDateRangeCaluse(data.from, data.to),
        'SEARCH' : '(?i).*' + data.search + '.*',
        'CUSTOM_ORDER': customOrder
      }), function(_error, _data) {

        if(_error) {
          _callback(_error, _data);
        }
        else {

          // Query on DB to find the sponsor information
          db.cypher(_scope._prepareQuery('singleMember', {
            'REFID': data.sponsor
          }), function(sponsorError, sponsorData) {

            var members = {
              members: _data,
              sponsor: {
                id: data.sponsor,
                name: ''
              }
            }

            if(!sponsorError) {
              members.sponsor.name = sponsorData[0].name;
            }

            if(countQuery && cQuery != '') {

              db.cypher(cQuery, function(cqerr, cqresp) {
                if(cqerr){
                  console.log(cqerr);
                }
                console.log(cqresp);
                members['totalUsers'] = ((cqresp && cqresp.length > 0) ? cqresp[0].totalusers : 0);
                return _callback(null, members);
              });
            }
            else {
              return _callback(null, members);
            }
          });

        }

      });
    },


    listCount: function(queryObj, _callback) {
      db.cypher(this._prepareQuery('listCount', {
        'REFID': queryObj.sponsor,
        'LEVEL_NUMBER': ((queryObj.level == 'all') ? 3 : queryObj.level)
      }), _callback);
    },

    verifyUsers:function(queryObj, _callback){

      // Query on Db verify User
      db.cypher(this._prepareQuery('verifyUser', {
        'USER_ID': queryObj.id
      }), _callback);
    },

    verifySponsorUsers:function(queryObj, _callback){

      // Query on DB verify Sponsor
      db.cypher(this._prepareQuery('verifySponsor', {
        'USER_ID': queryObj.id,
      }), _callback);
    },

    verifyByIds: function(queryObj, _callback) {

      // Query on DB verify Sponsor
      db.cypher(this._prepareQuery('verifyByIds', {
        'USER_IDS': JSON.stringify(queryObj),
      }), _callback);
    },

    updateSponser:function(queryObj, _callback){

    // Query on DB update user sponsor
      db.cypher(this._prepareQuery('SponsorUpdate',{
        'sponsorId': queryObj.sponsoruserId,
        'joindat':queryObj.createdat,
        'userId': queryObj.userId,
        'createdat':queryObj.createdat,
        'userEmail': queryObj.email,
        'userName': queryObj.username,
        'countryCode': queryObj.countryCode,
        'countryName': queryObj.countryName,
        'sponsorUserId': queryObj.sponsoruserId,
        'sponsorUsersName':queryObj.sponsorUsername,
        'sponsorProfileId':queryObj.sponsorProfileId
      }), _callback);
    },

    changeSponsorUser:function(queryObj, _callback){

      // Query on DB Change Sponsor
      db.cypher(this._prepareQuery('changeSponsor', {
        'userId': queryObj.userId,
        'sponsorId': queryObj.sponsoruserId,
        'sponsorUsersName':queryObj.sponsorUsername,
        'sponsorProfileId':queryObj.sponsorProfileId,
        'sponsorHpos': queryObj.sponsorHpos,
      }), _callback);
    },

    updateRelationUser:function(queryObj, _callback){

      // Query on DB Change Sponsor
      db.cypher(this._prepareQuery('updateRelation', {
        'userId': queryObj.userId,
        'sponsorOld': queryObj.sponsorOld,
      }), _callback);
    },

    addRelationUser:function(queryObj, _callback){

      // Query on DB Change Sponsor
      db.cypher(this._prepareQuery('addRelation', {
        'userId': queryObj.userId,
        'sponsoruserId': queryObj.sponsoruserId,
      }), _callback);
    },

    updateMember: function(queryObj, _callback) {

      // Query on DB to update user information
      db.cypher(this._prepareQuery('updateGraphNode', {
        'REFID': queryObj.id,
        'countryCode': queryObj.countryCode,
        'countryName': queryObj.countryName,
        'userEmail': queryObj.email,
        'userName': queryObj.name
      }), _callback);
    },

    getMember: function(queryObj, _callback) {

      // Query on DB to find the sponsor information
      db.cypher(this._prepareQuery('singleMember', {
        'REFID': queryObj.id
      }), _callback);

    },

    /**
    *  Get country : all user refered with userid
    * @method getMemberCountry
    * @param {string} id - user id
    * @return {List} [ ]
    */
    getMemberCountry: function(queryObj, _callback) {
      db.cypher(this._prepareQuery('memberCountry', {
        'REFID': queryObj.id + ''
      }), _callback);
    },

    getLeaderBoardInfoDirects: function(queryObj, _callback) {
      db.cypher(this._prepareQuery('leaderBoardMembersDirects', {
        'JOIN_AT_MIN': queryObj.joinMinDate + '',
        'JOIN_AT_MAX': queryObj.joinMaxDate + '',
      }), _callback);
    },

    getLeaderBoardInfoAllTimeDirects: function(queryObj, _callback) {
      db.cypher(this._prepareQuery('leaderBoardMembersAllTimeDirects', {}), _callback);
    },

    getLeaderBoardInfoAllDirects: function(queryObj, _callback) {
      db.cypher(this._prepareQuery('leaderBoardMembersAllDirects', {
        'JOIN_AT_MIN': queryObj.joinMinDate + '',
        'JOIN_AT_MAX': queryObj.joinMaxDate + '',
      }), _callback);
    },

    getLeaderBoardInfoAllTimeAllDirects: function(queryObj, _callback) {
      db.cypher(this._prepareQuery('leaderBoardMembersAllTimeAllDirects', {}), _callback);
    },

    getLatestSignups: function(queryObj, _callback) {
      db.cypher(this._prepareQuery('latestSignup', {
        'OFFSET': ((queryObj && queryObj.page && queryObj.page > 1) ? ((queryObj.page - 1) * 10) : 0)
      }), _callback);
    },

    getMySignups: function(queryObj, _callback) {
      var whereClause = ''; //'WHERE n.sponsor = "'+queryObj.id+'"';
      if(queryObj.createdat) {
        whereClause = 'WHERE n.joinat >= "' + queryObj.createdat.from + '" AND n.joinat < "' + queryObj.createdat.to + '"';
      }

      db.cypher(this._prepareQuery('getMySignups', {
        'REFID': queryObj.id + '',
        'WHERE_CLAUSE': whereClause
      }), _callback);
    },

    getMyTeamSignups: function(queryObj, _callback) {

      var whereClause = ''; //'WHERE n.sponsor = "'+queryObj.id+'"';;
      if(queryObj.createdat) {
        whereClause = 'WHERE n.joinat >= "' + queryObj.createdat.from + '" AND n.joinat < "' + queryObj.createdat.to + '"';
      }

      db.cypher(this._prepareQuery('getMyTeamSignups', {
        'REFID': queryObj.id + '',
        'WHERE_CLAUSE': whereClause
      }), _callback);
    },

    getLevelMySignups: function(queryObj, _callback) {
      db.cypher(this._prepareQuery('getLevelMySignups', {
        'REFID': queryObj.id + '',
        'LEVEL_NUMBER': queryObj.level
      }), _callback);
    },


    getResponse: function(query, _callback) {

      db.cypher(query, _callback);
    },

    findMemberById: function(queryObj, _callback) {

      db.cypher(this._prepareQuery('findMemberById', {
        "REFID": queryObj.id
      }), _callback);
    },

    timeBasedSignupCounts: function(queryObject, _callback) {
      var query = cypherQueries['timeBasedSignupCounts']
      query = query.replace(/REFID/g, queryObject.userId);
      query = query.replace(/DAY1_FROM/g, queryObject.date1From);
      query = query.replace(/DAY1_TO/g, queryObject.date1To);
      query = query.replace(/DAY7_FROM/g, queryObject.date7From);
      query = query.replace(/DAY7_TO/g, queryObject.date7To);
      query = query.replace(/DAY30_FROM/g, queryObject.date30From);
      query = query.replace(/DAY30_TO/g, queryObject.date30To);
      query = query.replace(/DAY365_FROM/g, queryObject.date365From);
      query = query.replace(/DAY365_TO/g, queryObject.date365To);

      return db.cypher(query, _callback);
    },

    getSaleMembers: function(userId, _callback) {

      return db.cypher(this._prepareQuery('saleMembers', {
        "REFID": userId
      }), _callback);
    }

  };

};

module.exports = new Genealogy();