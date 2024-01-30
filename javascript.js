document.addEventListener('DOMContentLoaded', function() {
    // Populate day dropdown
    const day_dropdown = document.getElementById('day_dropdown');
    for (let i = 1; i <= 31; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        day_dropdown.appendChild(option);
    }

    document.getElementById('add_date_button').addEventListener('click', add_input_date);

    function add_input_date() {
        const day = parseInt(document.getElementById('day_dropdown').value);
        const month = parseInt(document.getElementById('month_dropdown').value );

        add_date(month, day);
    }
    
    function add_date(month, day) {
        var new_day_div = document.createElement('div');
        new_day_div.classList.add('day-div');
        new_day_div.classList.add('possible-day-div');
        new_day_div.textContent = `${day} ${document.getElementById('month_dropdown').options[month - 1].text}`;
        new_day_div.dataset.month = month;
        new_day_div.dataset.day = day;

        document.getElementById('date_duplicate_error').style.display = 'none';
        
        var container = document.getElementById('graph-visual-container-one');
        let month_div = Array.from(container.querySelectorAll('.month-div')).find(div => parseInt(div.dataset.month) === month);

        if (!month_div) {
            month_div = document.createElement('div');
            month_div.classList.add('month-div');
            month_div.dataset.month = month;
            // Insert the new month-div in the correct order
            const monthDivs = Array.from(container.querySelectorAll('.month-div'));
            const insertBeforeMonthDiv = monthDivs.find(div => parseInt(div.dataset.month) > month);
            if (insertBeforeMonthDiv) {
                container.insertBefore(month_div, insertBeforeMonthDiv);
            } else {
                container.appendChild(month_div);
            }
        }

        const possible_day_divs = Array.from(month_div.querySelectorAll('.possible-day-div'));
        if (possible_day_divs.some(div => parseInt(div.dataset.day) === day)) {
            document.getElementById('date_duplicate_error').style.display = 'block';
            return;
        }

        const day_divs = Array.from(month_div.querySelectorAll('.day-div'));
        const insert_before_div = day_divs.find(div => parseInt(div.dataset.day) >= day);
        if (insert_before_div) {
            month_div.insertBefore(new_day_div, insert_before_div);
        } else {
            month_div.appendChild(new_day_div);
        }

        new_day_div.addEventListener('click', function() {
            remove_selected();
            this.classList.toggle('selected');
        });

        const placeholder_day_divs = Array.from(month_div.querySelectorAll('.placeholder-day-div'));
        const remove_placeholder = placeholder_day_divs.find(div => parseInt(div.dataset.day) == day);
        if (remove_placeholder) {
            month_div.removeChild(remove_placeholder);
        }


        const all_day_divs = container.querySelectorAll('.day-div');
        const unique_days = new Set();

        // Add placeholder day divs to months that don't have them
        all_day_divs.forEach(div => unique_days.add(div.dataset.day));
        const month_divs = container.querySelectorAll('.month-div');
        month_divs.forEach(month_div => {
            unique_days.forEach(day => {
                // Check if a div with this day already exists in the month-div
                if (!month_div.querySelector(`.day-div[data-day='${day}']`)) {
                    // Create and insert the placeholder div
                    const placeholder = document.createElement('div');
                    placeholder.classList.add('placeholder-day-div');
                    placeholder.classList.add('day-div');
                    placeholder.dataset.day = day;

                    // Find the correct position to insert the placeholder
                    let inserted = false;
                    const dayDivs = Array.from(month_div.querySelectorAll('.day-div'));
                    for (let i = 0; i < dayDivs.length; i++) {
                        if (parseInt(dayDivs[i].dataset.day) > day) {
                            month_div.insertBefore(placeholder, dayDivs[i]);
                            inserted = true;
                            break;
                        }
                    }
                    if (!inserted) {
                        month_div.appendChild(placeholder);
                    }
                }
            });
        });
        remove_selected();

        // Add the date as a state to the Kripke model
        add_date_to_model(month, day);
        compute_lines();
        document.getElementById('set_answer_button').disabled = false;
    }

    function remove_selected() {
        var container = document.getElementById('graph-visual-container-one');
        const possible_day_divs = Array.from(container.querySelectorAll('.possible-day-div'));
        possible_day_divs.forEach(div => div.classList.remove('selected'));
    }

    document.getElementById("day_dropdown").addEventListener("keypress", function(event) {
        // Check if the key pressed is 'Enter'
        if (event.key === "Enter") {
            // Prevent the default action to avoid form submission (if applicable)
            event.preventDefault();
            // Trigger the button click
            document.getElementById("add_date_button").click();
        }
    });

    document.getElementById("month_dropdown").addEventListener("keypress", function(event) {
        // Check if the key pressed is 'Enter'
        if (event.key === "Enter") {
            // Prevent the default action to avoid form submission (if applicable)
            event.preventDefault();
            // Trigger the button click
            document.getElementById("add_date_button").click();
        }
    });

    document.getElementById('set_answer_button').addEventListener('click', set_real_day_div);

    // The following function is now in logic.js
    // function public_announcement_one_holds() {
    //     return true;
    // }

    var false_states_model_2 = [];

    function add_second_model() {
        document.getElementById("graph-buttons-container-two").querySelector(".button").disabled = true;

        var graph_visual_container_two = document.createElement("div");
        graph_visual_container_two.id = "graph-visual-container-two";
        graph_visual_container_two.classList.add("graph-visual-container");
        
        var graph_ui_container = document.getElementById("graph-ui-container");
        graph_visual_container_two.innerHTML = document.getElementById("graph-visual-container-one").innerHTML;

        graph_visual_container_two.querySelectorAll('.possible-day-div').forEach(function(possible_day_div) {
            // Convert dataset values to integers for comparison
            const monthFromDiv = parseInt(possible_day_div.dataset.month);
            const dayFromDiv = parseInt(possible_day_div.dataset.day);
        
            if (false_states_model_2.some(function(state) {
                // Parse the month and day from the state, removing the 'm' and 'd' prefixes and converting to integers
                const monthFromState = parseInt(state[0].substring(1));
                const dayFromState = parseInt(state[1].substring(1));
        
                // Check if the month and day match
                return monthFromState === monthFromDiv && dayFromState === dayFromDiv;
            })) {
                // Call remove_date with the month and day as integers
                remove_date(graph_visual_container_two, monthFromDiv, dayFromDiv);
            }
        });
        

        graph_ui_container.appendChild(graph_visual_container_two);
        compute_lines();

        var buttons_container_three = document.createElement("div");
        buttons_container_three.id = "graph-buttons-container-three";
        buttons_container_three.classList.add("graph-buttons-container");
        document.getElementById("graph-ui-container").appendChild(buttons_container_three);

        add_next_button(add_second_announcement, document.getElementById('graph-buttons-container-three'));

        graph_visual_container_two.scrollIntoView({ behavior: 'smooth' });
    }

    function disable_main_ui() {
        document.getElementById('set_answer_button').disabled = true;
        document.getElementById('add_date_button').disabled = true;
        document.getElementById('day_dropdown').disabled = true;
        document.getElementById('month_dropdown').disabled = true;
        document.getElementById('preset_button').disabled = true;
        document.getElementById('random_button').disabled = true;
        document.getElementById('remove_date_button').disabled = true;
    }

    function enable_main_ui() {
        document.getElementById('set_answer_button').disabled = true;
        document.getElementById('add_date_button').disabled = false;
        document.getElementById('day_dropdown').disabled = false;
        document.getElementById('month_dropdown').disabled = false;
        document.getElementById('preset_button').disabled = false;
        document.getElementById('random_button').disabled = false;
        document.getElementById('remove_date_button').disabled = false;
    }

    function add_first_announcement() {
        disable_main_ui();
        document.getElementById("graph-buttons-container-one").querySelector(".button").disabled = true;

        // Check for a specific condition
        const [first_ann_holds, true_states, false_states] = public_announcement_one_holds();
        false_states_model_2 = false_states;
        if (first_ann_holds) {
            // If the condition is met, create a text message

            // Create a div element and assign it the class 'public-announcement-container'
            var container_div = document.createElement("div");
            container_div.classList.add("public-announcement-container");

            var text_message = document.createElement("p");
            text_message.textContent = "Albert: 'I don't know the answer, but I do know Bernard doesn't know the answer either.'";

            // Append the button to the container div
            container_div.appendChild(text_message);
            document.getElementById("graph-ui-container").appendChild(container_div);

            var buttons_container_two = document.createElement("div");
            buttons_container_two.id = "graph-buttons-container-two";
            buttons_container_two.classList.add("graph-buttons-container");
            document.getElementById("graph-ui-container").appendChild(buttons_container_two);

            add_next_button(add_second_model, buttons_container_two);

            text_message.scrollIntoView({ behavior: 'smooth' });
        } else {
            // If the condition is not met, create the error container element
            var errorContainer = document.createElement("div");
            errorContainer.className = "error_container";

            var errorMessage = document.createElement("span");
            errorMessage.id = "next_error_message";
            errorMessage.className = "error-message";
            errorMessage.setAttribute("role", "alert");
            errorMessage.textContent = "Public announcement 1 does not hold.";

            errorContainer.appendChild(errorMessage);
            document.getElementById("graph-ui-container").appendChild(errorContainer);

            errorMessage.scrollIntoView({ behavior: 'smooth' });
        }
    }

    var false_states_model_3 = [];

    function add_third_model() {
        document.getElementById("graph-buttons-container-four").querySelector(".button").disabled = true;

        var graph_visual_container_three = document.createElement("div");
        graph_visual_container_three.id = "graph-visual-container-three";
        graph_visual_container_three.classList.add("graph-visual-container");
        
        var graph_ui_container = document.getElementById("graph-ui-container");
        graph_visual_container_three.innerHTML = document.getElementById("graph-visual-container-two").innerHTML;

        graph_visual_container_three.querySelectorAll('.possible-day-div').forEach(function(possible_day_div) {
            // Convert dataset values to integers for comparison
            const monthFromDiv = parseInt(possible_day_div.dataset.month);
            const dayFromDiv = parseInt(possible_day_div.dataset.day);
        
            if (false_states_model_3.some(function(state) {
                // Parse the month and day from the state, removing the 'm' and 'd' prefixes and converting to integers
                const monthFromState = parseInt(state[0].substring(1));
                const dayFromState = parseInt(state[1].substring(1));
        
                // Check if the month and day match
                return monthFromState === monthFromDiv && dayFromState === dayFromDiv;
            })) {
                // Call remove_date with the month and day as integers
                remove_date(graph_visual_container_three, monthFromDiv, dayFromDiv);
            }
        });
        

        graph_ui_container.appendChild(graph_visual_container_three);
        compute_lines();

        var buttons_container_five = document.createElement("div");
        buttons_container_five.id = "graph-buttons-container-five";
        buttons_container_five.classList.add("graph-buttons-container");
        document.getElementById("graph-ui-container").appendChild(buttons_container_five);

        add_next_button(add_third_announcement, document.getElementById('graph-buttons-container-five'));

        graph_visual_container_three.scrollIntoView({ behavior: 'smooth' });
    }


    function add_second_announcement() {
        document.getElementById("graph-buttons-container-three").querySelector(".button").disabled = true;

        // Check for a specific condition
        const [second_ann_holds, true_states, false_states] = public_announcement_two_holds();
        false_states_model_3 = false_states;
        if (second_ann_holds) {
            // If the condition is met, create a text message

            // Create a div element and assign it the class 'public-announcement-container'
            var container_div = document.createElement("div");
            container_div.classList.add("public-announcement-container");

            var text_message = document.createElement("p");
            text_message.textContent = "Bernard: 'First I did't know, but now I do.'";

            // Append the button to the container div
            container_div.appendChild(text_message);
            document.getElementById("graph-ui-container").appendChild(container_div);

            var buttons_container_four = document.createElement("div");
            buttons_container_four.id = "graph-buttons-container-four";
            buttons_container_four.classList.add("graph-buttons-container");
            document.getElementById("graph-ui-container").appendChild(buttons_container_four);

            add_next_button(add_third_model, buttons_container_four);

            text_message.scrollIntoView({ behavior: 'smooth' });
        } else {
            // If the condition is not met, create the error container element
            var errorContainer = document.createElement("div");
            errorContainer.className = "error_container";

            var errorMessage = document.createElement("span");
            errorMessage.id = "next_error_message";
            errorMessage.className = "error-message";
            errorMessage.setAttribute("role", "alert");
            errorMessage.textContent = "Public announcement 2 does not hold.";

            errorContainer.appendChild(errorMessage);
            document.getElementById("graph-ui-container").appendChild(errorContainer);

            errorMessage.scrollIntoView({ behavior: 'smooth' });
        }
    }

    
    var false_states_model_4 = [];

    function add_fourth_model() {
        document.getElementById("graph-buttons-container-six").querySelector(".button").disabled = true;
        var graph_visual_container_four = document.createElement("div");
        graph_visual_container_four.id = "graph-visual-container-four";
        graph_visual_container_four.classList.add("graph-visual-container");
        
        var graph_ui_container = document.getElementById("graph-ui-container");
        graph_visual_container_four.innerHTML = document.getElementById("graph-visual-container-three").innerHTML;

        graph_visual_container_four.querySelectorAll('.possible-day-div').forEach(function(possible_day_div) {
            // Convert dataset values to integers for comparison
            const monthFromDiv = parseInt(possible_day_div.dataset.month);
            const dayFromDiv = parseInt(possible_day_div.dataset.day);
        
            if (false_states_model_4.some(function(state) {
                // Parse the month and day from the state, removing the 'm' and 'd' prefixes and converting to integers
                const monthFromState = parseInt(state[0].substring(1));
                const dayFromState = parseInt(state[1].substring(1));
        
                // Check if the month and day match
                return monthFromState === monthFromDiv && dayFromState === dayFromDiv;
            })) {
                // Call remove_date with the month and day as integers
                remove_date(graph_visual_container_four, monthFromDiv, dayFromDiv);
            }
        });
        

        graph_ui_container.appendChild(graph_visual_container_four);
        compute_lines();

        graph_visual_container_four.scrollIntoView({ behavior: 'smooth' });
    }


    function add_third_announcement() {
        document.getElementById("graph-buttons-container-five").querySelector(".button").disabled = true;

        // Check for a specific condition
        const [second_ann_holds, true_states, false_states] = public_announcement_three_holds();
        false_states_model_4 = false_states;
        if (second_ann_holds) {
            // If the condition is met, create a text message

            // Create a div element and assign it the class 'public-announcement-container'
            var container_div = document.createElement("div");
            container_div.classList.add("public-announcement-container");

            var text_message = document.createElement("p");
            text_message.textContent = "Albert: 'Now I know as well.'";

            // Append the button to the container div
            container_div.appendChild(text_message);
            document.getElementById("graph-ui-container").appendChild(container_div);

            var buttons_container_six = document.createElement("div");
            buttons_container_six.id = "graph-buttons-container-six";
            buttons_container_six.classList.add("graph-buttons-container");
            document.getElementById("graph-ui-container").appendChild(buttons_container_six);

            add_next_button(add_fourth_model, buttons_container_six);

            text_message.scrollIntoView({ behavior: 'smooth' });
        } else {
            // If the condition is not met, create the error container element
            var errorContainer = document.createElement("div");
            errorContainer.className = "error_container";

            var errorMessage = document.createElement("span");
            errorMessage.id = "next_error_message";
            errorMessage.className = "error-message";
            errorMessage.setAttribute("role", "alert");
            errorMessage.textContent = "Public announcement 3 does not hold.";

            errorContainer.appendChild(errorMessage);
            document.getElementById("graph-ui-container").appendChild(errorContainer);

            errorMessage.scrollIntoView({ behavior: 'smooth' });
        }
    }


    function add_next_button(callback, container) {
        // Create the Next button
        var next_button = document.createElement("button");
        next_button.innerHTML = "Next";
        next_button.classList.add('button');

        // Append the container div to the graph-visual-container div
        container.appendChild(next_button);


        // Add click event listener to the button
        next_button.addEventListener("click", callback);
    }
    

    function set_real_day_div() {
        var previous_real_day_div = document.querySelector('.real-day-div');
        if (previous_real_day_div) {
            previous_real_day_div.classList.remove('real-day-div');
        }
        var elements = document.querySelectorAll('.selected');
        elements.forEach(function(element) {
            element.classList.remove('selected');
            element.classList.add('real-day-div');

            set_true_date(element.dataset.month, element.dataset.day)
        });

        compute_lines();

        if (document.querySelector('#graph-buttons-container-one .button') === null) {
            add_next_button(add_first_announcement, document.getElementById('graph-buttons-container-one'));
        }
    }

    function remove_lines() {
        var elements = document.querySelectorAll('.line-div');
        elements.forEach(function(element) {
            element.parentNode.removeChild(element);
        });
    }

    function create_horizontal_lines() {
        // Select all '.month-div' elements that are children of '.graph-visual-container'
        const monthDivs = document.querySelectorAll('.graph-visual-container .month-div');
    
        // Loop through each '.month-div' element
        monthDivs.forEach((monthDiv) => {
            // Select all '.possible-day-div' elements that are children of the current '.month-div'
            const dayDivs = Array.from(monthDiv.querySelectorAll('.possible-day-div'));
    
            // Check if there are any '.possible-day-div' elements
            if (dayDivs.length > 0) {
                // Create a horizontal line between the first and last '.possible-day-div' elements
                if (dayDivs[0] && dayDivs[dayDivs.length - 1]) {
                    create_horizontal_line_between_divs(dayDivs[0], dayDivs[dayDivs.length - 1]);
                }
            }
        });
    }

    function create_vertical_lines() {
        // Select the first '.month-div' within '.graph-visual-container'
        const containers = document.querySelectorAll('.graph-visual-container');

        containers.forEach((container) => {
            const first_month_div = container.querySelector('.month-div');
        
            // Select all children of 'firstMonthDiv' with a 'data-day' attribute
            const day_divs = container.querySelectorAll('.possible-day-div');
            console.log(day_divs);
        
            // Extract 'data-day' values from these elements
            const all_possible_days = new Set(Array.from(day_divs).map(element => element.dataset.day));
            console.log(all_possible_days);
        
            // Loop through each possible day
            all_possible_days.forEach((day) => {
                let top_day_div, bottom_day_div;
                day = parseInt(day); 
        
                // Loop forward to find topDayDiv
                for (let i = 0; i < container.children.length; i++) {
                    let month_div = container.children[i];
                    let day_divs = Array.from(month_div.querySelectorAll('.possible-day-div')); // Assuming '.possible-day-div' is the class for divs you want to search through
                    top_day_div = day_divs.find(div => parseInt(div.dataset.day) === day);
                    if (top_day_div) {
                        break;
                    }
                }
        
                // Loop backward to find bottomDayDiv
                for (let i = container.children.length - 1; i >= 0; i--) {
                    let month_div = container.children[i];
                    let day_divs = Array.from(month_div.querySelectorAll('.possible-day-div')); // Same assumption as above
                    bottom_day_div = day_divs.find(div => parseInt(div.dataset.day) === day);
                    if (bottom_day_div) {
                        break;
                    }
                }
        
                // Call function to create a vertical line between the divs
                if (top_day_div && bottom_day_div) {
                    create_vertical_line_between_divs(top_day_div, bottom_day_div);
                }
            });
        });
    }
    
    // on window resize, recompute lines
    window.addEventListener('resize', compute_lines);

    function compute_lines() {
        remove_lines();
        create_horizontal_lines();
        create_vertical_lines();
    }

    function create_horizontal_line_between_divs(a, b) {
        var rect_a = a.getBoundingClientRect();
        var a_center_x = rect_a.left + rect_a.width / 2 + window.scrollX;
        var a_center_y = rect_a.top + rect_a.height / 2 - 1 + window.scrollY;
    
        var rect_b = b.getBoundingClientRect();
        var b_center_x = rect_b.left + rect_b.width / 2 + window.scrollX;
    
        var line_div = document.createElement('div');
        line_div.classList.add('horizontal-line-div');
        line_div.classList.add('line-div');
        line_div.style.left = a_center_x + 'px';
        line_div.style.top = a_center_y + 'px';
        line_div.style.width = (b_center_x - a_center_x) + 'px';
    
        document.getElementById('graph-ui-container').appendChild(line_div); // Consider appending to a specific container
    }

    function create_vertical_line_between_divs(a, b) {
        var rect_a = a.getBoundingClientRect();
        var a_center_y = rect_a.top + rect_a.height / 2 + window.scrollY;
        var a_center_x = rect_a.left + rect_a.width / 2 - 1 + window.scrollX;
    
        var rect_b = b.getBoundingClientRect();
        var b_center_y = rect_b.top + rect_b.height / 2 + window.scrollY;
    
        var line_div = document.createElement('div');
        line_div.classList.add('vertical-line-div');
        line_div.classList.add('line-div');
        line_div.style.left = a_center_x + 'px';
        line_div.style.top = a_center_y + 'px';
        line_div.style.height = (b_center_y - a_center_y) + 'px';
    
        document.getElementById('graph-ui-container').appendChild(line_div);
    }
    
    function remove_date(model, month, day) {
        console.log(month, day);
        const day_div = model.querySelector(`.possible-day-div[data-month='${month}'][data-day='${day}']`);
        day_div.classList.remove('possible-day-div');
        day_div.classList.remove('selected');
        day_div.classList.add('removed-day-div');

        remove_date_from_model(month, day);
    }

    function delete_date(month, day) {
        const day_div = document.querySelector(`.possible-day-div[data-month='${month}'][data-day='${day}']`);
        day_div.classList.remove('possible-day-div');
        day_div.classList.remove('selected');
        day_div.classList.add('placeholder-day-div');
        day_div.innerHTML = '';
        remove_date_from_model(month, day);
    }

    function remove_all_dates() {
        const day_divs = document.querySelectorAll('.day-div');
        
        day_divs.forEach(function(day_div) {
            day_div.parentNode.removeChild(day_div);
        });

        const month_divs = document.querySelectorAll('.month-div');
        month_divs.forEach(function(month_div) {
            month_div.parentNode.removeChild(month_div);
        });

        remove_all_dates_from_model();
    }

    document.getElementById('remove_date_button').addEventListener('click', function() {
        // get selected date div
        const selected_day_div = document.querySelector('.selected');
        if (!selected_day_div) {
            document.getElementById('remove_date_error').style.display = 'block';
            return;
        } else {
            document.getElementById('remove_date_error').style.display = 'none';
        }
        
        delete_date(parseInt(selected_day_div.dataset.month), parseInt(selected_day_div.dataset.day));
        compute_lines();
        // if there are no more dates, disable the set answer button
        if (document.querySelector('.possible-day-div') === null) {
            document.getElementById('set_answer_button').disabled = true;
        }
    });

    document.getElementById('clear_button').addEventListener('click', reset);
    
    function reset() {
        remove_lines();
        document.getElementById('graph-ui-container').innerHTML = "<div id='graph-visual-container-one' class='graph-visual-container'></div><div id='graph-buttons-container-one' class='graph-buttons-container'></div>";
        enable_main_ui();
        remove_all_dates_from_model();
    }

    document.getElementById('preset_button').addEventListener('click', function() {
        reset();
        // List of all possible dates from the riddle
        const dates = [
            { month: 5, day: 15 }, { month: 5, day: 16 }, { month: 5, day: 19 },
            { month: 6, day: 17 }, { month: 6, day: 18 },
            { month: 7, day: 14 }, { month: 7, day: 16 },
            { month: 8, day: 14 }, { month: 8, day: 15 }, { month: 8, day: 17 }
        ];

        // Adding each date using the add_date function
        dates.forEach(date => add_date(date.month, date.day));

        compute_lines();
        document.getElementById('set_answer_button').disabled = false;
    });

    document.getElementById('random_button').addEventListener('click', function() {
        // List of random dates
        const dates = [];
        const size = 10; // Desired size of the array

        while (dates.length < size) {
            const month = Math.floor(Math.random() * 6) + 1; // Generate a random month (1-12)
            const day = Math.floor(Math.random() * 15) + 1; // Generate a random day (1-31)
            const date = { month, day };

            // Check if the generated date already exists in the array
            const exists = dates.some(d => d.month === date.month && d.day === date.day);

            if (!exists) {
                dates.push(date); // Add the date if it's unique
            }
        }

        reset();

        // Adding each date using the add_date function
        dates.forEach(date => add_date(date.month, date.day));

        compute_lines();
        document.getElementById('set_answer_button').disabled = false;
    });

    
});