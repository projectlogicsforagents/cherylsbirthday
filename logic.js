// WORK IN PROGRESS

const know_month_wff = new MPL.Wff('K{m}m1 | K{m}m2 | K{m}m3 | K{m}m4 | K{m}m5 | K{m}m6 | K{m}m7 | K{m}m8 | K{m}m9 | K{m}m10 | K{m}m11 | K{m}m12')
const know_day_wff = new MPL.Wff('K{d}d1 | K{d}d2 | K{d}d3 | K{d}d4 | K{d}d5 | K{d}d6 | K{d}d7 | K{d}d8 | K{d}d9 | K{d}d10 | K{d}d11 | K{d}d12 | K{d}d13 | K{d}d14 | K{d}d15 | K{d}d16 | K{d}d17 | K{d}d18 | K{d}d19 | K{d}d20 | K{d}d21 | K{d}d22 | K{d}d23 | K{d}d24 | K{d}d25 | K{d}d26 | K{d}d27 | K{d}d28 | K{d}d29 | K{d}d30 | K{d}d31')

var model = new MPL.Model()

const agent_m = 'm' // Agent m has relations in month column, knows/is told the day
const agent_d = 'd' // Agent d has relations in day row, knows/is told the month

var _date_to_state_dict = {} // 'Dictionary' used to convert date to state index

function pop_date_to_state_dict(month, day) {
    const state_idx = _date_to_state_dict[to_month_atom(month) + to_day_atom(day)]
    delete _date_to_state_dict[state_idx]
    return state_idx
}

function add_date_to_state_dict(month, day, state_idx) {
    _date_to_state_dict[to_month_atom(month) + to_day_atom(day)] = state_idx
}

function add_date_to_model(month, day) {
    const state_idx = model.addState({ [to_month_atom(month)] : true, [to_day_atom(day)] : true})
    add_date_to_state_dict(month, day, state_idx)
    add_relations_to_new_date(state_idx, to_month_atom(month), to_day_atom(day))
    
    console.log("added state " + state_idx)
    console.log("states:")
    console.log(model.getStates())
    console.log("successors of new state by agent m:")
    console.log(model.getSuccessorsOf(state_idx, agent_m))
    console.log("successors of new state by agent d:")
    console.log(model.getSuccessorsOf(state_idx, agent_d))

    console.log("new state knows month? " + MPL.truth(model, state_idx, know_month_wff))
    console.log("new state knows day? " + MPL.truth(model, state_idx, know_day_wff))
}

function add_relations_to_new_date(state_idx, month_atom, day_atom) {
    // Also handles reflexive relations
    model.getStates().forEach(function (s, s_idx) {
        if (s !== null && s[month_atom]) {
            model.addTransition(state_idx, s_idx, agent_d)
            model.addTransition(s_idx, state_idx, agent_d)
        }
        if (s !== null && s[day_atom]) {
            model.addTransition(state_idx, s_idx, agent_m)
            model.addTransition(s_idx, state_idx, agent_m)
        }
    })
}

function remove_date_from_model(month, day) {
    const state_idx = pop_date_to_state_dict(month, day)
    model.removeState(state_idx)

    console.log("removed state " + state_idx)
    console.log(model.getStates())
}

function remove_all_dates_from_model() {
    model.removeAllStatesAndTransitions()
    _date_to_state_dict = {}

    console.log("removed all states")
    console.log("states:")
    console.log(model.getStates())
}

function to_month_atom(month) {
    return "m" + month.toString()
}

function to_day_atom(day) {
    return "d" + day.toString()
}