// WORK IN PROGRESS

const know_month_wff = new MPL.Wff('K{m}m1 | K{m}m2 | K{m}m3 | K{m}m4 | K{m}m5 | K{m}m6 | K{m}m7 | K{m}m8 | K{m}m9 | K{m}m10 | K{m}m11 | K{m}m12');
const know_day_wff = new MPL.Wff('K{d}d1 | K{d}d2 | K{d}d3 | K{d}d4 | K{d}d5 | K{d}d6 | K{d}d7 | K{d}d8 | K{d}d9 | K{d}d10 | K{d}d11 | K{d}d12 | K{d}d13 | K{d}d14 | K{d}d15 | K{d}d16 | K{d}d17 | K{d}d18 | K{d}d19 | K{d}d20 | K{d}d21 | K{d}d22 | K{d}d23 | K{d}d24 | K{d}d25 | K{d}d26 | K{d}d27 | K{d}d28 | K{d}d29 | K{d}d30 | K{d}d31');

var model = new MPL.Model();

const agent_m = 'm'; // Agent m has relations in month column, knows/is told the day
const agent_d = 'd'; // Agent d has relations in day row, knows/is told the month

var true_month = null;
var true_day = null;

var _date_to_state_dict = {}; // 'Dictionary' used to convert date to state index

function pop_date_to_state_dict(month, day) {
    const state_idx = _date_to_state_dict[to_month_atom(month) + to_day_atom(day)];
    delete _date_to_state_dict[state_idx];
    return state_idx;
}

function add_date_to_state_dict(month, day, state_idx) {
    _date_to_state_dict[to_month_atom(month) + to_day_atom(day)] = state_idx;
}

function add_date_to_model(month, day) {
    const state_idx = model.addState({ [to_month_atom(month)] : true, [to_day_atom(day)] : true});
    add_date_to_state_dict(month, day, state_idx);
    add_relations_to_new_date(state_idx, to_month_atom(month), to_day_atom(day));
    
    console.log("added state " + state_idx);
    console.log("states:");
    console.log(model.getStates());
}

function add_relations_to_new_date(state_idx, month_atom, day_atom) {
    // Also handles reflexive relations
    model.getStates().forEach(function (s, s_idx) {
        if (s !== null && s[month_atom]) {
            model.addTransition(state_idx, s_idx, agent_d);
            model.addTransition(s_idx, state_idx, agent_d);
        }
        if (s !== null && s[day_atom]) {
            model.addTransition(state_idx, s_idx, agent_m);
            model.addTransition(s_idx, state_idx, agent_m);
        }
    });
}

function remove_date_from_model(month, day) {
    const state_idx = pop_date_to_state_dict(month, day);
    model.removeState(state_idx);

    console.log("removed state " + state_idx);
}

function remove_all_dates_from_model() {
    model.removeAllStatesAndTransitions();
    _date_to_state_dict = {};

    console.log("removed all states");
}

function states_where_a_knows_birthday(model, agent) {
    var true_states = [];
    var false_states = [];
    const know_date_wff = (agent === agent_m ? know_month_wff : know_day_wff);

    model.getStates().forEach(function (s, s_idx) {
        if (s !== null) {
            if (MPL.truth(model, s_idx, know_date_wff)) {
                true_states.push(Object.keys(s));
            } else {
                false_states.push(Object.keys(s));
            }
        }
    });
    return [true_states, false_states]
}

function states_where_a_knows_b_not_knows_birthday(model, agent) {
    var true_states = [];
    var false_states = []; 
    const other_know_date_wff = (agent === agent_d ? know_month_wff : know_day_wff);
    const know_other_not_know_date_wff = new MPL.Wff("K{" + agent + "}~" + other_know_date_wff.ascii())

    model.getStates().forEach(function (s, s_idx) {
        if (s !== null) {
            if (MPL.truth(model, s_idx, know_other_not_know_date_wff)) {
                true_states.push(Object.keys(s));
            } else {
                false_states.push(Object.keys(s));
            }
        }
    });
    return [true_states, false_states]
}

function public_announcement_one_holds() {
    const [true_states, false_states] = states_where_a_knows_b_not_knows_birthday(model, agent_d);
    // The states the agents considers possible should not be removed from the model
    holds_in_true_month = !false_states.some(s => s[0] === to_month_atom(true_month));
    return [holds_in_true_month, true_states, false_states];
}

function public_announcement_two_holds() {
    const [true_states, false_states] = states_where_a_knows_birthday(model, agent_m);
    holds_in_true_day = !false_states.some(s => s[1] === to_day_atom(true_day));
    return [holds_in_true_day, true_states, false_states];
}

function public_announcement_three_holds() {
    const [true_states, false_states] = states_where_a_knows_birthday(model, agent_d);
    holds_in_true_month = !false_states.some(s => s[0] === to_month_atom(true_month));
    return [holds_in_true_month, true_states, false_states];
}

function set_true_date(month, day) {
    true_month = month;
    true_day = day;
}

function to_month_atom(month) {
    return "m" + month.toString();
}

function to_day_atom(day) {
    return "d" + day.toString();
}