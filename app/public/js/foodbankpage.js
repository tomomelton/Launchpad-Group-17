/**
 * ###############################################################################
 * 
 * File        : foodbankpage.js
 * 
 * Date        : Thursday 4th June 2026
 * 
 * Author      : Tom Melton
 * 
 * Description : Script to dynamically fill the foodbank page with the
*                information of the selected foodbank
 *  
 * History     : 03/06/2026 - v1.0
 * 
 * ###############################################################################
 */

document.addEventListener("DOMContentLoaded", () => {

    const data = JSON.parse(localStorage.getItem("selectedFoodbank"));

    if (data) {
        
        //####### Load Main Foodbank Details #######
        document.getElementById("fb-header").textContent =
            data.name;

        const addressParts = data.address.split(", ")
        document.getElementById("fb-address").innerHTML =
            "<b>Address: </b>" + addressParts[0] + ", " + addressParts[1];

        document.getElementById("fb-postcode").innerHTML =
            "<b>Postcode: </b>" + data.postcode;

        //####### Clear Placeholder Elements #######
        document.querySelectorAll(".list-placeholder").forEach(element => {
            element.remove();
        });

        //####### Load Foodbank Excess #######
        const excessList = document.getElementById("excess-list")

        data.excess.split(", ").forEach(item => {
            let p = document.createElement("p");
            p.textContent = item;

            let li = document.createElement("li");
            li.appendChild(p);

            excessList.appendChild(li);
        })

        //####### Load Foodbank Needs #######
        const needsList = document.getElementById("needs-list")

        data.needs.split(", ").forEach(item => {
            let p = document.createElement("p");
            p.textContent = item;

            let li = document.createElement("li");
            li.appendChild(p);

            needsList.appendChild(li);
        })

        

        
        
}

})