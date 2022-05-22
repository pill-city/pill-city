import React, {useEffect, useState} from "react"
import User from "../../models/User";
import Circle from "../../models/Circle";
import api from "../../api/Api";
import './Circles.css'
import PillModal from "../../components/PillModal/PillModal";
import CreateNewCircle from "../../components/CreateNewCircle/CreateNewCircle";
import {
  PlusIcon,
  TrashIcon,
  UserGroupIcon as UserGroupIconSolid,
} from "@heroicons/react/solid";
import {UserGroupIcon as UserGroupIconOutline} from "@heroicons/react/outline";

interface CircleCardProps {
  circle: Circle,
  onDelete: () => void
}

const CircleCard = (props: CircleCardProps) => {
  const {circle, onDelete} = props

  const deleteCircle = async () => {
    if (!confirm(`Are you sure you want to delete circle "${circle.name}"`)) {
      return
    }
    onDelete()
    await api.deleteCircle(circle.id)
  }

  return (
    <div className="circles-circle-card-wrapper" onClick={e => {
      e.stopPropagation()
      // history.push(`/profile/${user.id}`)
    }}>
      <div className="circles-circle-card-name">
        {circle.name}
      </div>
      <div className='circles-circle-card-right'>
        {circle.members.length !== 0 ?
          <div className='circles-circle-card-count-icon'>
            <UserGroupIconSolid />
          </div> :
          <div className='circles-circle-card-count-icon'>
            <UserGroupIconOutline />
          </div>
        }
        <div className='circles-circle-card-count'>
          {circle.members.length}
        </div>
        <div className='circles-circle-card-button' onClick={async (e) => {
          e.preventDefault()
          await deleteCircle()
        }}>
          <TrashIcon />
        </div>
      </div>
      </div>
  )
}

const renderCreateCircleComponents = (isOpen: boolean, onClose: () => void, onOpen: () => void) => {
  return (
    <>
      <PillModal
        isOpen={isOpen}
        onClose={onClose}
        title='Create new circle'
      >
        <CreateNewCircle onCancel={onClose}/>
      </PillModal>
      <div
        className='circles-create-circle-button'
        onClick={onOpen}
      >
        <PlusIcon />
      </div>
    </>

  )
}

export default () => {
  const [loading, updateLoading] = useState(true)
  const [users, updateUsers] = useState<User[]>([])
  const [circles, updateCircles] = useState<Circle[]>([])
  const [showingCreateCircleModal, updateShowingCreateCircleModal] = useState(false)

  useEffect(() => {
    (async () => {
      updateLoading(true)
      updateCircles(await api.getCircles())
      updateUsers(await api.getUsers())
      updateLoading(false)
    })()
  }, [])

  if (loading) {
    return (
      <div className='circles-wrapper'>
        <div className='circles-status'>Loading...</div>
      </div>
    )
  }

  const closeCreateCircleModal = () => {updateShowingCreateCircleModal(false)}
  const openCreateCircleModal = () => {updateShowingCreateCircleModal(true)}

  if (circles.length === 0) {
    return (
      <div className='circles-wrapper'>
        <div className='circles-status'>
          <p>You don't have any circles</p>
          <p><a href="#" onClick={() => {
            updateShowingCreateCircleModal(true)
          }}>Create one</a></p>
        </div>
        {renderCreateCircleComponents(showingCreateCircleModal, closeCreateCircleModal, openCreateCircleModal)}
      </div>
    )
  }

  return (
    <div className='circles-grid-container'>
      {circles.map(c => {
        return (
          <CircleCard
            key={c.id}
            circle={c}
            onDelete={() => {
              updateCircles(circles.filter(_ => _.id !== c.id))
            }}
          />
        )
      })}
      {renderCreateCircleComponents(showingCreateCircleModal, closeCreateCircleModal, openCreateCircleModal)}
    </div>
  )
}
