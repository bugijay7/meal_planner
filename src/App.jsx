import { useEffect, useMemo, useState } from 'react'
import heroImage from './assets/hero.jpg'
import breakfastImage from './assets/Breakfast.jpg'
import lunchImage from './assets/lunch.jpg'
import dinnerImage from './assets/dinner.jpg'
import './App.css'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner']
const STORAGE_KEY = 'meal-planner-week-v1'
const MAX_RECORDS = 999
const MAX_MEALS = DAYS.length * MEAL_TYPES.length

const blankMeal = {
  main_dish: '',
  sides: '',
  dessert: '',
  beverage: '',
}

const createEmptyPlanner = () =>
  DAYS.reduce((plan, day) => {
    plan[day] = { breakfast: null, lunch: null, dinner: null, notes: '' }
    return plan
  }, {})

const createDefaultDrafts = (planner) =>
  DAYS.reduce((drafts, day) => {
    drafts[day] = {
      breakfast: planner[day]?.breakfast ? { ...planner[day].breakfast } : { ...blankMeal },
      lunch: planner[day]?.lunch ? { ...planner[day].lunch } : { ...blankMeal },
      dinner: planner[day]?.dinner ? { ...planner[day].dinner } : { ...blankMeal },
      notes: planner[day]?.notes ?? '',
    }
    return drafts
  }, {})

const mealConfig = [
  {
    key: 'breakfast',
    label: 'Breakfast',
    image: breakfastImage,
  },
  {
    key: 'lunch',
    label: 'Lunch',
    image: lunchImage,
  },
  {
    key: 'dinner',
    label: 'Dinner',
    image: dinnerImage,
  },
]

function getStoredPlanner() {
  if (typeof window === 'undefined') return createEmptyPlanner()

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyPlanner()

    const parsed = JSON.parse(raw)
    const fallback = createEmptyPlanner()

    for (const day of DAYS) {
      fallback[day] = {
        ...fallback[day],
        ...(parsed?.[day] ?? {}),
      }
    }

    return fallback
  } catch {
    return createEmptyPlanner()
  }
}

function App() {
  const [planner, setPlanner] = useState(() => getStoredPlanner())
  const [drafts, setDrafts] = useState(() => createDefaultDrafts(getStoredPlanner()))
  const [activeDay, setActiveDay] = useState('monday')
  const [editingMeal, setEditingMeal] = useState(null)
  const [resetPending, setResetPending] = useState(false)
  const [toast, setToast] = useState({ visible: false, message: '', isError: false })

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(planner))
  }, [planner])

  useEffect(() => {
    setDrafts(createDefaultDrafts(planner))
  }, [planner])

  useEffect(() => {
    if (!toast.visible) return undefined

    const timer = window.setTimeout(() => {
      setToast((current) => ({ ...current, visible: false }))
    }, 2600)

    return () => window.clearTimeout(timer)
  }, [toast.visible])

  const totalRecordCount = useMemo(
    () =>
      DAYS.reduce((count, day) => {
        const dayPlan = planner[day]
        const meals = MEAL_TYPES.filter(
          (mealType) => !!dayPlan?.[mealType]?.main_dish?.trim(),
        ).length
        const notes = dayPlan?.notes?.trim() ? 1 : 0
        return count + meals + notes
      }, 0),
    [planner],
  )

  const progress = (totalRecordCount / MAX_MEALS) * 100

  const updateDraftValue = (day, mealType, field, value) => {
    setDrafts((current) => ({
      ...current,
      [day]: {
        ...current[day],
        [mealType]: {
          ...(current[day]?.[mealType] ?? { ...blankMeal }),
          [field]: value,
        },
      },
    }))
  }

  const updateNotesDraft = (day, value) => {
    setDrafts((current) => ({
      ...current,
      [day]: {
        ...current[day],
        notes: value,
      },
    }))
  }

  const showToast = (message, isError = false) => {
    setToast({ visible: true, message, isError })
  }

  const switchDay = (day) => {
    setActiveDay(day)
    setEditingMeal(null)
  }

  const saveMeal = (mealType) => {
    const mealDraft = drafts[activeDay]?.[mealType]
    const mainDish = mealDraft?.main_dish?.trim() || ''

    if (!mainDish) {
      showToast('Please fill in the main dish field.', true)
      return
    }

    if (totalRecordCount >= MAX_RECORDS && !planner[activeDay]?.[mealType]?.main_dish) {
      showToast('Record limit reached. Cannot save.', true)
      return
    }

    setPlanner((current) => ({
      ...current,
      [activeDay]: {
        ...current[activeDay],
        [mealType]: {
          main_dish: mealDraft.main_dish.trim(),
          sides: mealDraft.sides.trim(),
          dessert: mealDraft.dessert.trim(),
          beverage: mealDraft.beverage.trim(),
        },
      },
    }))

    setEditingMeal(null)
    showToast('Meal saved!')
  }

  const saveNotes = () => {
    const notes = drafts[activeDay]?.notes ?? ''

    if (totalRecordCount >= MAX_RECORDS && !planner[activeDay]?.notes) {
      showToast('Record limit reached.', true)
      return
    }

    setPlanner((current) => ({
      ...current,
      [activeDay]: {
        ...current[activeDay],
        notes,
      },
    }))

    showToast('Notes saved!')
  }

  const confirmReset = () => {
    const cleared = createEmptyPlanner()
    setPlanner(cleared)
    setDrafts(createDefaultDrafts(cleared))
    setResetPending(false)
    showToast('Week has been reset!')
  }

  const visibleMeal = (mealType) => editingMeal === mealType || !planner[activeDay]?.[mealType]?.main_dish

  const getDisplayValue = (value) => value?.trim() || '—'

  return (
    <div className="min-h-screen bg-[#e8e8e8] text-black">
      <header>
        <section className="hero-section">
          <img
            className="hero-bg-img"
            src={heroImage}
            alt="Fresh vegetables on a beige background"
          />
          <div className="hero-overlay" />
          <div className="hero-content">
            <h1 className="type-h1 text-[#e2ef5f]">Your Weekly</h1>
            <h1 className="type-h1 -mt-4 text-[#e2ef5f]">Meal Planner</h1>
          </div>
        </section>
      </header>

      <div
        id="toast"
        className={`toast ${toast.visible ? 'visible' : ''} ${toast.isError ? 'error' : ''}`}
        role="status"
        aria-live="polite"
      >
        {toast.message}
      </div>

      <main className="planner-section">
        <div className="content-grid">
          <p className="type-h4 mb-4 m-0">Select a Day Below</p>

          <div className="tabs-row mb-6" id="tabs-row">
            {DAYS.map((day) => {
              const label = new Date(2024, 0, { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7 }[day]).toLocaleString('en-US', {
                weekday: 'short',
              })

              return (
                <button
                  key={day}
                  type="button"
                  className={`button-tab ${activeDay === day ? 'active' : ''}`}
                  onClick={() => switchDay(day)}
                  aria-pressed={activeDay === day}
                >
                  {label}
                </button>
              )
            })}

            <div id="reset-container" className="ml-auto">
              {!resetPending ? (
                <button type="button" className="button-reset" onClick={() => setResetPending(true)}>
                  Reset Week
                </button>
              ) : (
                <div className="reset-confirm-row">
                  <button type="button" className="button-confirm-danger" onClick={confirmReset}>
                    Confirm Reset
                  </button>
                  <button type="button" className="button-cancel" onClick={() => setResetPending(false)}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="type-h4 mb-2.5 m-0" id="progress-label">
            {totalRecordCount}/{MAX_MEALS} Meals Planned
          </p>

          <div
            className="progress-track mb-10"
            role="progressbar"
            aria-valuenow={totalRecordCount}
            aria-valuemin={0}
            aria-valuemax={MAX_MEALS}
          >
            <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>

          <div className={`limit-warning ${totalRecordCount >= MAX_RECORDS ? 'visible' : ''}`}>
            Maximum of 999 records reached. Please delete some entries first.
          </div>

          <div className="meal-grid">
            {mealConfig.map(({ key, label, image }) => {
              const mealDraft = drafts[activeDay]?.[key] ?? { ...blankMeal }
              const record = planner[activeDay]?.[key]

              return (
                <article key={key}>
                  <div className="meal-image-card">
                    <img src={image} alt={label} className="meal-image" />
                    <div className="meal-image-overlay">
                      <h3 className="type-h3 text-[#e2ef5f]">{label}</h3>
                    </div>
                  </div>

                  <div className="meal-form-card" id={`card-${key}`}>
                    {visibleMeal(key) ? (
                      <div id={`form-${key}`} className="meal-card-form">
                        <div className="meal-input-group">
                          <label htmlFor={`${key}-main`} className="type-h5">
                            Main Dish
                          </label>
                          <input
                            id={`${key}-main`}
                            className="meal-input"
                            placeholder={`e.g. ${label === 'Breakfast' ? 'Scrambled eggs' : label === 'Lunch' ? 'Grilled chicken salad' : 'Grilled salmon'}`}
                            value={mealDraft.main_dish}
                            onChange={(event) => updateDraftValue(activeDay, key, 'main_dish', event.target.value)}
                          />
                        </div>
                        <div className="meal-input-group">
                          <label htmlFor={`${key}-sides`} className="type-h5">
                            Sides
                          </label>
                          <input
                            id={`${key}-sides`}
                            className="meal-input"
                            placeholder={`e.g. ${label === 'Breakfast' ? 'Toast, fruit' : label === 'Lunch' ? 'Soup, crackers' : 'Roasted vegetables'}`}
                            value={mealDraft.sides}
                            onChange={(event) => updateDraftValue(activeDay, key, 'sides', event.target.value)}
                          />
                        </div>
                        <div className="meal-input-group">
                          <label htmlFor={`${key}-dessert`} className="type-h5">
                            Dessert
                          </label>
                          <input
                            id={`${key}-dessert`}
                            className="meal-input"
                            placeholder={`e.g. ${label === 'Breakfast' ? 'Yogurt parfait' : label === 'Lunch' ? 'Fruit salad' : 'Chocolate mousse'}`}
                            value={mealDraft.dessert}
                            onChange={(event) => updateDraftValue(activeDay, key, 'dessert', event.target.value)}
                          />
                        </div>
                        <div className="meal-input-group">
                          <label htmlFor={`${key}-beverage`} className="type-h5">
                            Beverage
                          </label>
                          <input
                            id={`${key}-beverage`}
                            className="meal-input"
                            placeholder={`e.g. ${label === 'Breakfast' ? 'Orange juice' : label === 'Lunch' ? 'Sparkling water' : 'Herbal tea'}`}
                            value={mealDraft.beverage}
                            onChange={(event) => updateDraftValue(activeDay, key, 'beverage', event.target.value)}
                          />
                        </div>
                        <button type="button" className="button-save" onClick={() => saveMeal(key)}>
                          Save
                        </button>
                      </div>
                    ) : (
                      <div id={`saved-${key}`} className="meal-card-saved">
                        <div className="meal-input-group">
                          <p className="type-h5 m-0 mb-1">Main Dish</p>
                          <p className="saved-value">{getDisplayValue(record?.main_dish)}</p>
                        </div>
                        <div className="meal-input-group">
                          <p className="type-h5 m-0 mb-1">Sides</p>
                          <p className="saved-value">{getDisplayValue(record?.sides)}</p>
                        </div>
                        <div className="meal-input-group">
                          <p className="type-h5 m-0 mb-1">Dessert</p>
                          <p className="saved-value">{getDisplayValue(record?.dessert)}</p>
                        </div>
                        <div className="meal-input-group">
                          <p className="type-h5 m-0 mb-1">Beverage</p>
                          <p className="saved-value">{getDisplayValue(record?.beverage)}</p>
                        </div>
                        <button type="button" className="button-edit" onClick={() => setEditingMeal(key)}>
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>

          <div className="notes-form-part">
            <label htmlFor="notes-textarea" className="type-h5">
              Daily Notes
            </label>
            <textarea
              id="notes-textarea"
              className="notes-textarea"
              maxLength={400}
              value={drafts[activeDay]?.notes ?? ''}
              onChange={(event) => updateNotesDraft(activeDay, event.target.value)}
              placeholder="Add any notes for this day"
              aria-label="Daily notes"
            />
            <div className="notes-footer">
              <span id="char-count">Characters remaining: {400 - (drafts[activeDay]?.notes ?? '').length}</span>
              <button type="button" id="save-btn-notes" className="button-save notes-save" onClick={saveNotes}>
                Save Notes
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
