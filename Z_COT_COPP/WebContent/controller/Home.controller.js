 sap.ui.define([
	"com/esless/cotcopassessment/controller/BaseController",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/json/JSONModel",
	"com/esless/cotcopassessment/model/Formatter",
	"sap/ui/unified/library",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter"
	], function (Controller, DateFormat, JSONModel, Formatter,unifiedLibrary, MessageToast,MessageBox,Fragment,Filter) {
	"use strict";

	return Controller.extend("com.esless.cotcopassessment.controller.Home", {
		oFormatter:Formatter,		
		onInit: function () {
			var today=new Date();
			var date1MonthBack=new Date();
			date1MonthBack.setMonth(date1MonthBack.getMonth() - 1);
			var obj={
					busy:false,
					delay:0,
					oHistoryItems:[]
			};
			var oPageModel=new JSONModel(obj);
			this.getView().setModel(oPageModel,"oPageModel");

			var mode="";
			var compData=this.getOwnerComponent().getComponentData();
			if(compData){
				var sParam=compData.startupParameters;
				if(sParam && sParam.mode){
					mode=sParam.mode[0];
				}
			}
			oPageModel.setProperty("/loginMode",mode);
			this.getRouter().getRoute("home").attachPatternMatched(this._onHomeMatched, this);
		},

		_onHomeMatched:function(oEvent){
			this.onSearchGoPress();			
		},

		//on pres Go button to get data
		onSearchGoPress:function(oEvent){
			this.getcotcopassessmentHistoryData();
		},

		// get COT COP History Data
		getcotcopassessmentHistoryData:function(e){
			var oPageModel=this.getModel("oPageModel");
			var mode= oPageModel.getProperty("/loginMode");
			var oFilters=[];

			if(mode=="R1"){
				oFilters.push(new Filter("Status","EQ","B"));
			}else if(mode=="HOD"){
				oFilters.push(new Filter("Status","EQ","C"));
			}else if(mode=="CPO"){
				oFilters.push(new Filter("Status","EQ","D"));
			}else if(mode=="TMT"){
				oFilters.push(new Filter("Status","EQ","X"));
			}

			var oModel=this.getModel();
			oPageModel.setProperty("/busy",true);
			var sPath="/cotp_mainSet";
			oModel.read(sPath,{filters:oFilters,
				success:function(oData,oResponse){
					oPageModel.setProperty("/busy",false);
					oPageModel.setProperty("/oHistoryItems",oData.results);
					this.getStatusWiseCount(oData.results);
				}.bind(this),error:function(err){
					oPageModel.setProperty("/busy",false);
					MessageBox.error(JSON.parse(err.responseText).error.message.value);
				}.bind(this)});
		},

		getStatusWiseCount:function(data){
			var oPageModel=this.getModel("oPageModel");
			var totalPendingSubmission=data.filter((obj) => (obj.Status == "A" || obj.Status == "R")).length;
			var totalSubmitted=data.filter((obj) => (obj.Status == "B" || obj.Status == "C" || obj.Status == "D")).length;
			var totalApproved=data.filter((obj) => obj.Status == "Z").length;
			var totalCompleted=data.filter((obj) => obj.Status == "Z").length;
			oPageModel.setProperty("/totalPendingSubmission",totalPendingSubmission);
			oPageModel.setProperty("/totalSubmitted",totalSubmitted);
			oPageModel.setProperty("/totalApproved",totalApproved);
			oPageModel.setProperty("/totalCompleted",totalCompleted);
		},

		// on search History Table
		onSearchHistoryTable:function(oEvent){
			var sQuery = oEvent.getParameter("query");
			if(oEvent.getId() == "liveChange"){
				sQuery = oEvent.getParameter("newValue");
			}
			var oFilter1=new Filter("RefNo","Contains",sQuery);
			var oFilter2=new Filter("Pernr","Contains",sQuery);
			var oFilter3=new Filter("Name","Contains",sQuery);
			var oFilter4=new Filter("Desg","Contains",sQuery);
			var oFilter5=new Filter("Dept","Contains",sQuery);
			var oFilter6=new Filter("StatusDesc","Contains",sQuery);
			var oFilter7=new Filter("R1Name","Contains",sQuery);
			var aFilters=new Filter([oFilter1,oFilter2,oFilter3,oFilter4,oFilter5,oFilter6,oFilter7]);
			var oTable=this.byId("ID_HIS_Table");
			var oBinding=oTable.getBinding("items");
			if(oBinding){
				oBinding.filter([aFilters]);
			}
		},
		//handle factory function to show table data
		historyTableFactory:function(sId,oContext){
			//var oPageModel=this.getModel("oPageModel");
			var sObj=oContext.getObject();
			var monthsFlag="",today=new Date();
			if(sObj.ResubDate < today || sObj.Returned == "X"){
				monthsFlag="X";
			}
			sObj.monthsFlag=monthsFlag;
			var oTemplateHisTable=sap.ui.xmlfragment("com.esless.cotcopassessment.fragments.oHistoryTableData", this);
			return oTemplateHisTable;
		},

		// on press create form to fill new assigned form
		onPressCreateForm:function(oEvent){
			var oSrc=oEvent.getSource();
			var sObj=oSrc.getBindingContext("oPageModel").getObject();
			sObj.navMode="C";
			delete sObj.__metadata;
			delete sObj.idpcreatetoviewnav;
			this.getRouter().navTo("detail",{detailObj:encodeURIComponent(JSON.stringify(sObj))});
		},
		// on press edit form to edit existing reverted form
		onPressEditForm:function(oEvent){
			//this.getRouter().navTo("detail",{detailObj:"23453"});
			var oSrc=oEvent.getSource();
			var sObj=oSrc.getBindingContext("oPageModel").getObject();
			sObj.navMode="E";
			delete sObj.__metadata;
			this.getRouter().navTo("detail",{detailObj:encodeURIComponent(JSON.stringify(sObj))});
		},
		//on click table row/item to display data
		onPressItem:function(oEvent){
			var oSrc=oEvent.getSource();
			var sObj=oEvent.getParameter("listItem").getBindingContext("oPageModel").getObject();
			sObj.navMode="D";
			delete sObj.__metadata;
			this.getRouter().navTo("detail",{detailObj:encodeURIComponent(JSON.stringify(sObj))});
		}

		//End Controller
	});
});