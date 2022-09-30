sap.ui.define([ "sap/ui/core/mvc/Controller", "sap/ui/core/routing/History" ], function(Controller, History) {
    "use strict";

    var Controller = Controller.extend("com.esless.cotcopassessment.controller.BaseController", {

		getRouter: function(that) {
			if (that !== undefined) {
				return sap.ui.core.UIComponent.getRouterFor(that);
			}
			return sap.ui.core.UIComponent.getRouterFor(this);
		},

		getModel : function(sName) {
			return this.getView().getModel(sName) || this.getOwnerComponent().getModel(sName);
		},

		setModel : function(oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		getResourceBundle : function() {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		onNavBack : function() {
			this.getRouter().navTo("home");
		},
		
		_getClonedObject: function(obj) {
			return JSON.parse(JSON.stringify(obj));
		},
		showErrorMessage: function(message, title) {
			sap.m.MessageBox.error(message, {
				title: title
			});
		},
		onLiveChangeNumberFields:function(oEvent){
			var oSrc=oEvent.getSource();
			var oVal=oEvent.getParameter("value");
			var val=oSrc._$input.data('val');
			var regx= /^\d{0,11}(\.\d{0,2})?$/
			if(!oVal.match(regx) && oVal.length>0){
				oVal=val;
				oSrc.setValue(oVal);
			}
			oSrc._$input.data('val',oVal);
		},
		
		//get Months difference b/w 2 dates
		monthDiff:function(d1, d2,roundUpFractionalMonths) {
			//Months will be calculated between start and end dates.
		    //Make sure start date is less than end date.
		    //But remember if the difference should be negative.
			var d1=new Date(d1), d2=new Date(d2);
		    var startDate=d1;
		    var endDate=d2;
		    var inverse=false;
		    if(d1>d2)
		    {
		        startDate=d2;
		        endDate=d1;
		        inverse=true;
		    }

		    //Calculate the differences between the start and end dates
		    var yearsDifference=endDate.getFullYear()-startDate.getFullYear();
		    var monthsDifference=endDate.getMonth()-startDate.getMonth();
		    var daysDifference=endDate.getDate()-startDate.getDate();

		    var monthCorrection=0;
		    //If roundUpFractionalMonths is true, check if an extra month needs to be added from rounding up.
		    //The difference is done by ceiling (round up), e.g. 3 months and 1 day will be 4 months.
		    if(roundUpFractionalMonths===true && daysDifference>0)
		    {
		        monthCorrection=1;
		    }
		    //If the day difference between the 2 months is negative, the last month is not a whole month.
		    else if(roundUpFractionalMonths!==true && daysDifference<0)
		    {
		        monthCorrection=-1;
		    }

		    //return (inverse?-1:1)*(yearsDifference*12+monthsDifference+monthCorrection);
		    return (yearsDifference*12+monthsDifference+monthCorrection);
		},
		
    });
    return Controller;
});
