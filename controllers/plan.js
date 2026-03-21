const Plan = require("../model/plan");
const { getCurrentDate, getISODate } = require("../util/helper-functions");

exports.createPlan = async (req, res, next) => {
    const adminAccess = req.user.isAdmin;
    const {name, minimum, maximum, dailyProfitMin, dailyProfitMax, referralBonus, endDate} = req.body

    const plan = new Plan({
          name,
          minimum, 
          maximum, 
          dailyProfitMin,
          dailyProfitMax, 
          referralBonus, 
          endDate
    })

    try {
        if (adminAccess) {
            const savePlan = await plan.save();
            res.status(200).json({message: savePlan})
        }  else {
            res.status(401).json({message: "Unauthorized User"})
        }
    } catch (error) {
        console.log(error) 
        res.status(500).json({message: "Error creating plan"})
    }
}

exports.editPlan = async (req, res, next) => {
    const adminAccess = req.user.isAdmin;
    const id = req.params.id;
    const {name, minimum, maximum, dailyProfitMin, dailyProfitMax, referralBonus, endDate} = req.body;

    try {
        if (adminAccess) {
            const updatePlan = await Plan.findByIdAndUpdate(id, {
                name,
                minimum, 
                maximum, 
                dailyProfitMin,
                dailyProfitMax, 
                referralBonus, 
                endDate
            }, { new: true });
            
            if (updatePlan) {
                res.status(200).json({message: updatePlan});
            } else {
                res.status(404).json({message: "Plan not found"});
            }
        } else {
            res.status(401).json({message: "Unauthorized User"});
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Error updating plan"});
    }
}

exports.deletePlan = async (req, res, next) => {
    const adminAccess = req.user.isAdmin;
    const id = req.params.id;

    try {
        if (adminAccess) {
            const deletePlan = await Plan.findByIdAndDelete(id);
            if (deletePlan) {
                res.status(200).json({message: "Plan deleted successfully!"});
            } else {
                res.status(404).json({message: "Plan not found"});
            }
        } else {
            res.status(401).json({message: "Unauthorized User"});
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Error deleting plan"});
    }
}

exports.getPlan = async (req, res, next) => {
    const plan = await Plan.find();
    if (plan && plan.length > 0) {
        res.status(200).json({message: plan})
    } else {
        res.status(201).json({message: "no plan created"})
    }
}


exports.getMatchingPlans = async (req, res, next) => {
    const amount = Number(req.query.amount);
    try {
        const plans = await Plan.find();
        const matchingPlans = plans.filter(p => amount >= Number(p.minimum) && amount <= Number(p.maximum));
        res.status(200).json({ message: matchingPlans });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error fetching matching plans" });
    }
}

exports.checkPlan = async (amount) => {
    const plan = await Plan.find();
    const check = plan.filter(p =>  amount >= Number(p.minimum) && amount <= Number(p.maximum) )
    
    if (check.length === 0) {
        throw new Error("No matching plan for this amount");
    }
    const planId = check[0]._id

   return planId;
}